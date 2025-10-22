import { Request, Response } from "express";
import { parsePaging } from "../../utils/pagination";
import { countAuctions, findAuctionById, findAuctions, placeBidAtomic } from "../../services/auction.service";
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
      currency: a.currency ?? 'VND',
      endsAt: a.endsAt ? new Date(a.endsAt).toISOString() : undefined,
      condition: a.condition ?? undefined,
      featured: !!a.featured
    }));

  return sendSuccess(res, { items, page, pageSize, total });
  } catch (err: any) {
    console.error('getAuctions error', err);
    return res.status(500).json({ success: false, error: { message: 'Internal error' } });
  }
}

export async function placeBid(req: Request, res: Response) {
  try {
    const user = (req as any).user;
  if (!user || !user.sub) return sendError(res, 401, 'Unauthorized');
    const auctionId = req.params.id;
    const amount = typeof req.body.amount === 'number' ? req.body.amount : Number(req.body.amount);
  if (!auctionId || !amount || isNaN(amount) || amount <= 0) return sendError(res, 400, 'Invalid auction id or amount');

    // optimistic check: fetch auction to provide better error messages
    const auction = await findAuctionById(auctionId);
  if (!auction) return sendError(res, 404, 'Auction not found');
    const now = new Date();
  if (new Date(auction.endsAt) <= now) return sendError(res, 410, 'Auction ended');
    if (typeof auction.currentPrice === 'number' && amount <= auction.currentPrice) {
  return sendError(res, 409, 'Bid must be greater than current price', { currentPrice: auction.currentPrice });
    }

    const updated = await placeBidAtomic(auctionId, String(user.sub), amount);
    if (!updated) {
      // lost race or validation failed atomically
      return sendError(res, 409, 'Bid rejected (too low or auction ended)');
    }

    return sendSuccess(res, { auction: updated });
  } catch (err: any) {
    console.error('placeBid error', err);
    return res.status(500).json({ success: false, error: { message: 'Internal error' } });
  }
}

export async function getAuctionById(req: Request, res: Response) {
  try {
    const id = req.params.id;
  if (!id) return sendError(res, 400, 'Missing auction id');
  const auction = await findAuctionById(id);
  if (!auction) return sendError(res, 404, 'Auction not found');

    const result = {
      id: String(auction._id),
      title: auction.title,
      imageUrl: auction.imageUrl ?? '',
      quantity: auction.quantity ?? 1,
      currentPrice: auction.currentPrice,
      currency: auction.currency ?? 'VND',
      endsAt: auction.endsAt ? new Date(auction.endsAt).toISOString() : undefined,
      condition: auction.condition ?? undefined,
      featured: !!auction.featured,
      biddersCount: Array.isArray(auction.bidHistory) ? Array.from(new Set(auction.bidHistory.map((b: any) => String(b.userId)))).length : 0,
      bidHistory: auction.bidHistory ?? []
    };

  return sendSuccess(res, result);
  } catch (err: any) {
    console.error('getAuctionById error', err);
    return sendError(res, 500, 'Internal error');
  }
}
