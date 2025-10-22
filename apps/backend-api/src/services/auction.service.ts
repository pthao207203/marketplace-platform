import { AuctionModel } from "../models/auction.model";
import { Types } from "mongoose";

export async function findAuctionById(id: string) {
  return AuctionModel.findById(id).lean();
}

/**
 * Atomically place a bid on an auction.
 * Returns the updated auction (lean) on success or null if validation failed (e.g., amount <= currentPrice or auction ended).
 */
export async function placeBidAtomic(auctionId: string, userId: string, amount: number) {
  const now = new Date();
  const filter: any = {
    _id: auctionId,
    endsAt: { $gt: now },
    currentPrice: { $lt: amount }
  };

  const update: any = {
    $push: { bidHistory: { userId: new Types.ObjectId(userId), amount, createdAt: now } },
    $set: { currentPrice: amount }
  };

  const opts = { new: true } as const;
  const updated = await AuctionModel.findOneAndUpdate(filter, update, opts).lean();
  return updated;
}

// --- Auction DB helpers -----------------------------------------------------
export async function findAuctions(filter: any, skip = 0, limit = 20) {
  return AuctionModel.find(filter).sort({ endsAt: 1 }).skip(skip).limit(limit).lean();
}

export async function countAuctions(filter: any) {
  return AuctionModel.countDocuments(filter);
}

export async function findFeaturedAuctionByFlag(filter: any = {}) {
  return AuctionModel.findOne({ ...filter, featured: true }).sort({ endsAt: 1 }).lean();
}

export async function findNearestEndingAuction(filter: any = {}) {
  const docs = await findAuctions(filter, 0, 1);
  return docs && docs.length ? docs[0] : null;
}
