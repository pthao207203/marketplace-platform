//apps/backend-api/src/controllers/client/auction.controller.ts
import { Request, Response } from "express";
import { parsePaging } from "../../utils/pagination";
import {
  countAuctions,
  findAuctionById,
  findAuctions,
  placeBidAtomic,
  findParticipatedAuctions,
  findUserWonAuctions,
  findUserLostAuctions,
} from "../../services/auction.service";
import { UserModel } from "../../models/user.model";
import { ProductModel } from "../../models/product.model";
import { sendSuccess, sendError } from "../../utils/response";
import { AuctionModel } from "../../models/auction.model";
import { createOrderFromAuction } from "../../services/order.service";
import OrderModel from "../../models/order.model";

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
      // include linked product id when this auction was created from a product
      productId: undefined as string | undefined,
    }));

    // Bulk-resolve any auctions that were created from products and attach productId
    try {
      const auctionIds = docs.map((d: any) => d._id).filter(Boolean);
      if (auctionIds.length) {
        const linked = await ProductModel.find({
          "productAuction.auctionId": { $in: auctionIds },
        })
          .select("_id productAuction.auctionId")
          .lean<any>();
        const map: Record<string, string> = {};
        for (const p of linked) {
          const aid = p?.productAuction?.auctionId;
          if (aid) map[String(aid)] = String(p._id);
        }
        for (const it of items) {
          const pid = map[it.id];
          if (pid) it.productId = pid;
        }
      }
    } catch (e) {
      // non-fatal: return items without productId mapping
      console.warn("getAuctions: failed to resolve linked product ids", e);
    }

    // If user is logged in, include their avatar and wallet balance for UI
    let currentUser: any = undefined;
    const currentUserId = (req as any).user?.sub;
    if (currentUserId) {
      try {
        const cu = await UserModel.findById(String(currentUserId))
          .select("_id userAvatar userName userWallet.balance")
          .lean<any>();
        if (cu) {
          currentUser = {
            id: String(cu._id),
            avatar: cu.userAvatar ?? undefined,
            name: cu.userName ?? undefined,
            balance:
              cu.userWallet && typeof cu.userWallet.balance === "number"
                ? cu.userWallet.balance
                : 0,
          };
        }
      } catch (e) {
        // ignore
      }
    }

    return sendSuccess(res, { items, page, pageSize, total, currentUser });
  } catch (err: any) {
    console.error("getAuctions error", err);
    return res
      .status(500)
      .json({ success: false, error: { message: "Internal error" } });
  }
}


export async function getParticipatedAuctions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const { page, pageSize, skip, limit } = parsePaging(req.query);
    const now = new Date();
    const filter = { endsAt: { $gt: now }, "bidHistory.userId": user.sub } as any;

    const docs = await findParticipatedAuctions(String(user.sub), skip, limit);
    const total = await countAuctions(filter);

    const items = docs.map((a: any) => {
      // Calculate if user is currently leading
      const bids = Array.isArray(a.bidHistory) ? a.bidHistory : [];
      const sortedBids = bids.sort((x: any, y: any) => {
        const xAmount = typeof x.amount === 'number' ? x.amount : Number(x.amount);
        const yAmount = typeof y.amount === 'number' ? y.amount : Number(y.amount);
        return yAmount - xAmount;
      });
      
      const highestBid = sortedBids[0];
      const isLeading = highestBid && String(highestBid.userId) === String(user.sub);
      
      // Get user's highest bid
      const myBids = bids
        .filter((b: any) => b.userId && String(b.userId) === String(user.sub))
        .map((b: any) => (typeof b.amount === 'number' ? b.amount : Number(b.amount)))
        .filter((n: any) => !isNaN(n));
      const myBidAmount = myBids.length ? Math.max(...myBids) : undefined;

      return {
        id: String(a._id),
        title: a.title,
        imageUrl: a.imageUrl ?? "",
        quantity: a.quantity ?? 1,
        currentPrice: a.currentPrice,
        currency: a.currency ?? "VND",
        endsAt: a.endsAt ? new Date(a.endsAt).toISOString() : undefined,
        condition: a.condition ?? undefined,
        featured: !!a.featured,
        productId: undefined as string | undefined,
        myBidAmount: myBidAmount,
        isLeading: isLeading, // NEW: Flag to indicate if user is winning
      };
    });

    try {
      const auctionIds = docs.map((d: any) => d._id).filter(Boolean);
      if (auctionIds.length) {
        const linked = await ProductModel.find({
          "productAuction.auctionId": { $in: auctionIds },
        })
          .select("_id productAuction.auctionId")
          .lean<any>();
        const map: Record<string, string> = {};
        for (const p of linked) {
          const aid = p?.productAuction?.auctionId;
          if (aid) map[String(aid)] = String(p._id);
        }
        for (const it of items) {
          const pid = map[it.id];
          if (pid) it.productId = pid;
        }
      }
    } catch (e) {
      console.warn("getParticipatedAuctions: failed to resolve linked product ids", e);
    }

    // include current user info for UI (avatar + balance)
    let currentUser: any = undefined;
    try {
      const cu = await UserModel.findById(String(user.sub))
        .select("_id userAvatar userName userWallet.balance")
        .lean<any>();
      if (cu) {
        currentUser = {
          id: String(cu._id),
          avatar: cu.userAvatar ?? undefined,
          name: cu.userName ?? undefined,
          balance:
            cu.userWallet && typeof cu.userWallet.balance === "number"
              ? cu.userWallet.balance
              : 0,
        };
      }
    } catch (e) {
      // ignore
    }

    return sendSuccess(res, { items, page, pageSize, total, currentUser });
  } catch (err: any) {
    console.error("getParticipatedAuctions error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function getSuccessfulAuctions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const { page, pageSize, skip, limit } = parsePaging(req.query);
    const now = new Date();
    const userId = String(user.sub);

    // Find auctions where:
    // 1. Auction has ended
    // 2. User is the finalWinnerId
    // 3. State is 'awaiting_confirmation' or 'paid'
    const wonAuctions = await AuctionModel.find({
      endsAt: { $lte: now },
      finalWinnerId: userId,
      finalState: { $in: ['awaiting_confirmation', 'paid'] },
    })
      .sort({ finalizedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuctionModel.countDocuments({
      endsAt: { $lte: now },
      finalWinnerId: userId,
      finalState: { $in: ['awaiting_confirmation', 'paid'] },
    });

    // Fetch associated orders for auctions that have been paid
    const auctionIdsWithOrders = wonAuctions
      .filter((a: any) => a.orderId)
      .map((a: any) => String(a._id));
    
    const orders = await OrderModel.find({
      orderPaymentReference: { 
        $in: wonAuctions.map((a: any) => `AUCTION-${String(a._id)}`) 
      }
    }).lean();
    
    const orderMap: Record<string, any> = {};
    for (const ord of orders) {
      const ref = (ord as any).orderPaymentReference;
      if (ref && ref.startsWith('AUCTION-')) {
        const aId = ref.replace('AUCTION-', '');
        orderMap[aId] = ord;
      }
    }

    const items = wonAuctions.map((a: any) => {
      const aId = String(a._id);
      const order = orderMap[aId];
      
      return {
        id: aId,
        title: a.title,
        imageUrl: a.imageUrl ?? "",
        quantity: a.quantity ?? 1,
        currentPrice: a.currentPrice,
        finalPrice: a.finalPrice,
        currency: a.currency ?? "VND",
        endsAt: a.endsAt ? new Date(a.endsAt).toISOString() : undefined,
        condition: a.condition ?? undefined,
        featured: !!a.featured,
        productId: undefined as string | undefined,
        finalState: a.finalState,
        finalizedAt: a.finalizedAt ? new Date(a.finalizedAt).toISOString() : undefined,
        
        // NEW: Include order info if exists
        orderId: order ? String((order as any)._id) : undefined,
        orderStatus: order ? (order as any).orderStatus : undefined,
        needsAddressConfirmation: a.finalState === 'awaiting_confirmation',
      };
    });

    // Resolve productId mapping
    try {
      const auctionIds = wonAuctions.map((d: any) => d._id).filter(Boolean);
      if (auctionIds.length) {
        const linked = await ProductModel.find({
          "productAuction.auctionId": { $in: auctionIds },
        })
          .select("_id productAuction.auctionId")
          .lean<any>();
        const map: Record<string, string> = {};
        for (const p of linked) {
          const aid = p?.productAuction?.auctionId;
          if (aid) map[String(aid)] = String(p._id);
        }
        for (const it of items) {
          const pid = map[it.id];
          if (pid) it.productId = pid;
        }
      }
    } catch (e) {
      console.warn("getSuccessfulAuctions: failed to resolve linked product ids", e);
    }

    // include current user info for UI (avatar + balance)
    let currentUser: any = undefined;
    try {
      const cu = await UserModel.findById(String(user.sub))
        .select("_id userAvatar userName userWallet.balance")
        .lean<any>();
      if (cu) {
        currentUser = {
          id: String(cu._id),
          avatar: cu.userAvatar ?? undefined,
          name: cu.userName ?? undefined,
          balance:
            cu.userWallet && typeof cu.userWallet.balance === "number"
              ? cu.userWallet.balance
              : 0,
        };
      }
    } catch (e) {
      // ignore
    }

    return sendSuccess(res, { items, page, pageSize, total, currentUser });
  } catch (err: any) {
    console.error("getSuccessfulAuctions error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function getFailedAuctions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const { page, pageSize, skip, limit } = parsePaging(req.query);
    const now = new Date();
    const userId = String(user.sub);

    // Find all ended auctions where user participated
    const allEndedWithUserBids = await AuctionModel.find({
      endsAt: { $lte: now },
      'bidHistory.userId': userId,
    })
      .sort({ endsAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter to only include auctions where user LOST
    const lostAuctions = allEndedWithUserBids.filter((a: any) => {
      // If finalized, check finalWinnerId
      if (a.finalWinnerId) {
        return String(a.finalWinnerId) !== userId;
      }
      
      // If not finalized, check if someone else has highest bid
      const bids = Array.isArray(a.bidHistory) ? a.bidHistory : [];
      if (bids.length === 0) return false;
      
      const sortedBids = bids.sort((x: any, y: any) => {
        const xAmount = typeof x.amount === 'number' ? x.amount : Number(x.amount);
        const yAmount = typeof y.amount === 'number' ? y.amount : Number(y.amount);
        return yAmount - xAmount;
      });
      
      const highestBid = sortedBids[0];
      return highestBid && String(highestBid.userId) !== userId;
    });

    const items = lostAuctions.map((a: any) => ({
      id: String(a._id),
      title: a.title,
      imageUrl: a.imageUrl ?? "",
      quantity: a.quantity ?? 1,
      currentPrice: a.currentPrice,
      currency: a.currency ?? "VND",
      endsAt: a.endsAt ? new Date(a.endsAt).toISOString() : undefined,
      condition: a.condition ?? undefined,
      featured: !!a.featured,
      productId: undefined as string | undefined,
    }));

    try {
      const auctionIds = lostAuctions.map((d: any) => d._id).filter(Boolean);
      if (auctionIds.length) {
        const linked = await ProductModel.find({
          "productAuction.auctionId": { $in: auctionIds },
        })
          .select("_id productAuction.auctionId")
          .lean<any>();
        const map: Record<string, string> = {};
        for (const p of linked) {
          const aid = p?.productAuction?.auctionId;
          if (aid) map[String(aid)] = String(p._id);
        }
        for (const it of items) {
          const pid = map[it.id];
          if (pid) it.productId = pid;
        }
      }
    } catch (e) {
      console.warn("getFailedAuctions: failed to resolve linked product ids", e);
    }

    // include current user info for UI (avatar + balance)
    let currentUser: any = undefined;
    try {
      const cu = await UserModel.findById(String(user.sub))
        .select("_id userAvatar userName userWallet.balance")
        .lean<any>();
      if (cu) {
        currentUser = {
          id: String(cu._id),
          avatar: cu.userAvatar ?? undefined,
          name: cu.userName ?? undefined,
          balance:
            cu.userWallet && typeof cu.userWallet.balance === "number"
              ? cu.userWallet.balance
              : 0,
        };
      }
    } catch (e) {
      // ignore
    }

    return sendSuccess(res, { items, page, pageSize, total: items.length, currentUser });
  } catch (err: any) {
    console.error("getFailedAuctions error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function confirmAuctionOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    
    const auctionId = req.params.id;
    if (!auctionId) return sendError(res, 400, "Missing auction id");

    const body = req.body || {};
    const shippingAddressId = body.shippingAddressId;
    const shippingAddressObj = body.shippingAddress;

    // Fetch auction
    const auction = await AuctionModel.findById(auctionId).lean();
    if (!auction) return sendError(res, 404, "Auction not found");

    // Verify user is the winner
    if (!auction.finalWinnerId || String(auction.finalWinnerId) !== String(user.sub)) {
      return sendError(res, 403, "Only auction winner can confirm order");
    }

    // Verify auction is in correct state
    if (auction.finalState !== 'awaiting_confirmation') {
      return sendError(res, 400, `Auction already ${auction.finalState}`);
    }

    // Get shipping address
    let shippingAddress: any = null;
    if (shippingAddressId) {
      const u = await UserModel.findById(String(user.sub))
        .select("userAddress")
        .lean<any>();
      shippingAddress =
        (u?.userAddress || []).find(
          (a: any) => String(a._id) === String(shippingAddressId)
        ) || null;
      if (!shippingAddress)
        return sendError(res, 400, "Shipping address not found");
    } else if (shippingAddressObj && typeof shippingAddressObj === "object") {
      shippingAddress = shippingAddressObj;
    } else {
      return sendError(res, 400, "Missing shipping address");
    }

    // Find linked product
    let linkedProduct: any = null;
    try {
      linkedProduct = await ProductModel.findOne({
        'productAuction.auctionId': auctionId,
      })
        .select('_id productShopId')
        .lean<any>();
    } catch (e) {
      linkedProduct = null;
    }

    const finalPrice = auction.finalPrice || auction.currentPrice;
    const quantity = auction.quantity || 1;

    // Prepare order document
    const orderDoc: any = {
      orderBuyerId: user.sub,
      orderSellerIds: linkedProduct && linkedProduct.productShopId ? [linkedProduct.productShopId] : [],
      orderItems: [
        {
          productId: linkedProduct ? linkedProduct._id : null,
          name: auction.title || "Auction item",
          imageUrl: auction.imageUrl || "",
          price: finalPrice,
          qty: quantity,
          shopId: linkedProduct && linkedProduct.productShopId ? linkedProduct.productShopId : null,
          lineTotal: finalPrice * quantity,
        },
      ],
      orderSubtotal: finalPrice * quantity,
      orderShippingFee: 0,
      orderTotalAmount: finalPrice * quantity,
      orderStatus: 0, // PENDING
      orderPaymentMethod: 'wallet',
      orderPaymentStatus: 'pending',
      orderShippingAddress: shippingAddress,
      orderNote: `Order created from auction ${auctionId}`,
      orderPaymentReference: `AUCTION-${auctionId}`,
    };

    // Create order and charge wallet in transaction
    let inserted: any[] = [];
    try {
      inserted = await createOrderFromAuction(orderDoc, {
        auctionId: String(auctionId),
        paymentReference: orderDoc.orderPaymentReference,
      });
    } catch (err: any) {
      const msg = (err && err.message) || '';
      if (msg.includes('INSUFFICIENT_FUNDS')) {
        // Mark auction as payment_failed
        await AuctionModel.updateOne(
          { _id: auctionId },
          { $set: { finalState: 'payment_failed' } }
        );
        return sendError(res, 402, "Insufficient wallet balance", {
          required: orderDoc.orderTotalAmount,
        });
      }
      throw err;
    }

    // Success - update auction with orderId
    if (inserted.length > 0) {
      await AuctionModel.updateOne(
        { _id: auctionId },
        { $set: { orderId: inserted[0]._id } }
      );
    }

    return sendSuccess(res, {
      order: inserted[0],
      auction: {
        id: String(auctionId),
        finalState: 'paid',
      },
    }, 201);

  } catch (err: any) {
    console.error("confirmAuctionOrder error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function placeBid(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    // Require user to have at least one shipping address before bidding
    try {
      const uu = await UserModel.findById(String(user.sub)).select("userAddress").lean<any>();
      const hasAddr = uu && Array.isArray(uu.userAddress) && uu.userAddress.length > 0;
      if (!hasAddr) return sendError(res, 400, "Please add a shipping address before participating in auctions");
    } catch (e) {
      // non-fatal, but block bidding if we cannot verify address
      return sendError(res, 400, "Please add a shipping address before participating in auctions");
    }
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
// Replace getAuctionById in auction.controller.ts

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

    // Enrich bid history with bidder info (avatar, wallet balance)
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
          .select("_id userAvatar userName userWallet.balance")
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

    // Sort bids by amount descending (largest first)
    bidHistory.sort((a: any, b: any) => (b.amount ?? 0) - (a.amount ?? 0));

    // Compute highest bid amount placed by current user (if any)
    let myBidAmount: number | undefined = undefined;
    let isLeading = false;
    
    if (currentUserInfo) {
      const myBids = rawBids
        .filter(
          (b: any) => b.userId && String(b.userId) === String(currentUserId)
        )
        .map((b: any) =>
          typeof b.amount === "number" ? b.amount : Number(b.amount)
        )
        .filter((n: any) => !isNaN(n));
      
      if (myBids.length) {
        myBidAmount = Math.max(...myBids);
        
        // Check if user is currently leading
        const highestBid = bidHistory[0];
        if (highestBid && String(highestBid.userId) === String(currentUserId)) {
          isLeading = true;
        }
      }
    }

    // Calculate maxCanBid (maximum user can bid with current balance)
    let maxCanBid: number | undefined = undefined;
    if (currentUserInfo) {
      const balance = currentUserInfo.userWallet?.balance ?? 0;
      
      // If user is currently leading, they can add their current bid back to balance
      // because if outbid, their money will be returned
      if (isLeading && myBidAmount) {
        maxCanBid = balance + myBidAmount;
      } else {
        maxCanBid = balance;
      }
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
            name: currentUserInfo.userName ?? "Người dùng",
            balance:
              currentUserInfo.userWallet &&
              typeof currentUserInfo.userWallet.balance === "number"
                ? currentUserInfo.userWallet.balance
                : 0,
            myBidAmount: myBidAmount,
            isLeading: isLeading,
            maxCanBid: maxCanBid, // NEW: Maximum amount user can bid
          }
        : undefined,
    };

    return sendSuccess(res, result);
  } catch (err: any) {
    console.error("getAuctionById error", err);
    return sendError(res, 500, "Internal error");
  }
}
