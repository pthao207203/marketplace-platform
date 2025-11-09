import { Request, Response } from "express";
import { parsePaging } from "../../utils/pagination";
import {
  countAuctions,
  findAuctionById,
  findAuctions,
  placeBidAtomic,
} from "../../services/auction.service";
import { UserModel } from "../../models/user.model";
import { ProductModel } from "../../models/product.model";
import { sendSuccess, sendError } from "../../utils/response";

export async function getAuctions(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePaging(req.query);
    const now = new Date();
    const filter = { endsAt: { $gt: now } } as any;

    const docs = await findAuctions(filter, skip, limit);
    const total = await countAuctions(filter);

    const items = docs.map((a: any) => ({
      id: String(a._id),
      title: a.title,
      imageUrl: a.imageUrl ?? "",
      quantity: a.quantity ?? 1,
      currentPrice: a.currentPrice,
      currency: a.currency ?? "VND",
      endsAt: a.endsAt ? new Date(a.endsAt).toISOString() : undefined,
      condition: a.condition ?? undefined,
      featured: !!a.featured,
    }));

    return sendSuccess(res, { items, page, pageSize, total });
  } catch (err: any) {
    console.error("getAuctions error", err);
    return res
      .status(500)
      .json({ success: false, error: { message: "Internal error" } });
  }
}

export async function placeBid(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const auctionId = req.params.id;
    const amount =
      typeof req.body.amount === "number"
        ? req.body.amount
        : Number(req.body.amount);
    if (!auctionId || !amount || isNaN(amount) || amount <= 0)
      return sendError(res, 400, "Invalid auction id or amount");

    // optimistic check: fetch auction to provide better error messages
    const auction = await findAuctionById(auctionId);
    if (!auction) return sendError(res, 404, "Auction not found");
    const now = new Date();
    if (new Date(auction.endsAt) <= now)
      return sendError(res, 410, "Auction ended");
    if (
      typeof auction.currentPrice === "number" &&
      amount <= auction.currentPrice
    ) {
      return sendError(res, 409, "Bid must be greater than current price", {
        currentPrice: auction.currentPrice,
      });
    }

    const updated = await placeBidAtomic(auctionId, String(user.sub), amount);
    if (!updated) {
      // lost race or validation failed atomically
      return sendError(res, 409, "Bid rejected (too low or auction ended)");
    }

    return sendSuccess(res, { auction: updated });
  } catch (err: any) {
    console.error("placeBid error", err);
    return res
      .status(500)
      .json({ success: false, error: { message: "Internal error" } });
  }
}

export async function getAuctionById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing auction id");

    // First try to load auction by id. If not found, treat id as a product id
    // and lookup the product's productAuction.auctionId to find the auction.
    let auction = await findAuctionById(id);
    if (!auction) {
      try {
        const prod = await ProductModel.findById(id)
          .select("productAuction.auctionId")
          .lean<any>();
        const aid = prod?.productAuction?.auctionId;
        if (aid) auction = await findAuctionById(String(aid));
      } catch (e) {
        // ignore and handle not-found below
      }
    }

    if (!auction) return sendError(res, 404, "Auction not found");

    // enrich bid history with bidder info (avatar, wallet balance)
    const rawBids = Array.isArray(auction.bidHistory) ? auction.bidHistory : [];
    const uniqueUserIds = Array.from(
      new Set(
        rawBids
          .map((b: any) => (b.userId ? String(b.userId) : null))
          .filter(Boolean)
      )
    );

    let usersMap: Record<string, any> = {};
    if (uniqueUserIds.length) {
      try {
        const users = await UserModel.find({ _id: { $in: uniqueUserIds } })
          .select("_id userAvatar userName")
          .lean<any>();
        for (const u of users) usersMap[String(u._id)] = u;
      } catch (e) {
        // non-fatal: leave usersMap empty
      }
    }

    // If a user is logged in, fetch their avatar and wallet balance and compute their bid amount
    let currentUserInfo: any = undefined;
    const currentUserId = (req as any).user?.sub;
    if (currentUserId) {
      try {
        const cu = await UserModel.findById(String(currentUserId))
          .select("_id userAvatar userWallet.balance")
          .lean<any>();
        if (cu) currentUserInfo = cu;
      } catch (e) {
        // non-fatal
      }
    }

    const bidHistory = rawBids.map((b: any) => {
      const uid = b.userId ? String(b.userId) : undefined;
      const user = uid ? usersMap[uid] : undefined;
      return {
        userId: uid,
        amount: typeof b.amount === "number" ? b.amount : Number(b.amount),
        createdAt: b.createdAt
          ? new Date(b.createdAt).toISOString()
          : undefined,
        byUser: user
          ? {
              id: String(user._id),
              avatar: user.userAvatar ?? undefined,
              name: user.userName ?? "Người dùng",
            }
          : undefined,
      };
    });

    // sort bids by amount descending (largest first)
    bidHistory.sort((a: any, b: any) => (b.amount ?? 0) - (a.amount ?? 0));

    // compute highest bid amount placed by current user (if any)
    let myBidAmount: number | undefined = undefined;
    if (currentUserInfo) {
      const myBids = rawBids
        .filter(
          (b: any) => b.userId && String(b.userId) === String(currentUserId)
        )
        .map((b: any) =>
          typeof b.amount === "number" ? b.amount : Number(b.amount)
        )
        .filter((n: any) => !isNaN(n));
      if (myBids.length) myBidAmount = Math.max(...myBids);
    }

    const result = {
      id: String(auction._id),
      title: auction.title,
      imageUrl: auction.imageUrl ?? "",
      quantity: auction.quantity ?? 1,
      currentPrice: auction.currentPrice,
      currency: auction.currency ?? "VND",
      endsAt: auction.endsAt
        ? new Date(auction.endsAt).toISOString()
        : undefined,
      condition: auction.condition ?? undefined,
      featured: !!auction.featured,
      biddersCount: uniqueUserIds.length,
      bidHistory,
      currentUser: currentUserInfo
        ? {
            id: String(currentUserInfo._id),
            avatar: currentUserInfo.userAvatar ?? undefined,
            balance:
              currentUserInfo.userWallet &&
              typeof currentUserInfo.userWallet.balance === "number"
                ? currentUserInfo.userWallet.balance
                : 0,
            myBidAmount: myBidAmount,
          }
        : undefined,
    };

    return sendSuccess(res, result);
  } catch (err: any) {
    console.error("getAuctionById error", err);
    return sendError(res, 500, "Internal error");
  }
}
