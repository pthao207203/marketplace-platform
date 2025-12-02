// apps/backend-api/src/services/auction.finalizer.service.ts
import { AuctionModel } from "../models/auction.model";
import OrderModel from "../models/order.model";
import { ProductModel } from '../models/product.model';
import { UserModel } from "../models/user.model";
import { Types } from 'mongoose';

/**
 * Find auctions that ended and are still pending finalization.
 * NEW LOGIC: Just mark the winner, don't create order yet.
 * Winner will need to confirm shipping address, then order is created.
 */
export async function finalizeEndedAuctions(limit = 20) {
  const now = new Date();

  // Find candidate auctions: ended and still pending (treat missing finalState as pending)
  const candidates = await AuctionModel.find({
    endsAt: { $lte: now },
    $or: [
      { finalState: "pending" },
      { finalState: { $exists: false } },
      { finalState: null },
    ],
  })
    .limit(limit)
    .lean();
    
  if (!candidates || !candidates.length) return { processed: 0 };

  let processed = 0;

  for (const a of candidates) {
    const ok = await processAuction(a as any);
    if (ok) processed++;
  }

  return { processed };
}

// Process single auction: determine winner and mark auction
async function processAuction(a: any) {
  const auctionId = String(a._id);

  // Attempt to mark as 'processing' to claim this worker (accept missing finalState)
  const claimed = await AuctionModel.updateOne(
    {
      _id: auctionId,
      $or: [
        { finalState: "pending" },
        { finalState: { $exists: false } },
        { finalState: null },
      ],
    },
    { $set: { finalState: "processing" } }
  );
  
  if (!claimed.matchedCount) return false; // Someone else claimed it

  try {
    const bids = Array.isArray(a.bidHistory) ? a.bidHistory : [];

    // Prefer finalWinnerId/finalPrice when present (handles manually-inserted auctions)
    let winnerId: string | null = a.finalWinnerId ? String(a.finalWinnerId) : null;
    let finalPrice: number | null = a.finalPrice !== undefined && a.finalPrice !== null ? Number(a.finalPrice) : null;

    if (!winnerId || !finalPrice) {
      if (!bids.length) {
        // No bids -> mark as no_bids
        await AuctionModel.updateOne(
          { _id: auctionId },
          { 
            $set: { 
              finalState: "no_bids", 
              finalizedAt: new Date() 
            } 
          }
        );
        return true;
      }

      // Find highest bid (winner)
      const sortedBids = [...bids].sort((x: any, y: any) => {
        const xAmt = typeof x.amount === 'number' ? x.amount : Number(x.amount);
        const yAmt = typeof y.amount === 'number' ? y.amount : Number(y.amount);
        return yAmt - xAmt;
      });
      const winningBid = sortedBids[0];
      if (!winnerId) winnerId = String(winningBid.userId);
      if (!finalPrice) finalPrice = Number(winningBid.amount);
    }

    // Find the product being auctioned
    const product = await ProductModel.findOne({ 'productAuction.auctionId': a._id }).lean();
    const prod: any = product as any;
    if (!prod) {
      await AuctionModel.updateOne(
        { _id: auctionId },
        { $set: { finalState: 'error', finalizedAt: new Date() } }
      );
      console.error(`Auction ${auctionId} error: product not found`);
      return false;
    }

    // Find the winner user and their default address
    const user = await UserModel.findById(winnerId).lean();
    if (!user) {
      await AuctionModel.updateOne(
        { _id: auctionId },
        { $set: { finalState: 'error', finalizedAt: new Date() } }
      );
      console.error(`Auction ${auctionId} error: winner user not found`);
      return false;
    }
    const addressList = ((user as any).userAddress || []);
    const address = addressList.find((a: any) => a.isDefault) || addressList[0];
    if (!address) {
      await AuctionModel.updateOne(
        { _id: auctionId },
        { $set: { finalState: 'error', finalizedAt: new Date() } }
      );
      console.error(`Auction ${auctionId} error: winner has no address`);
      return false;
    }

    // Compose the order document as requested
    const nowDate = new Date();
    const orderDoc: any = {
      orderBuyerId: new Types.ObjectId(winnerId),
      orderSellerIds: prod.productShopId ? [new Types.ObjectId(prod.productShopId)] : [],
      orderItems: [
        {
          productId: new Types.ObjectId(prod._id),
          name: prod.productName,
          imageUrl: Array.isArray(prod.productMedia) && prod.productMedia.length ? prod.productMedia[0] : prod.imageUrl,
          price: finalPrice,
          qty: a.quantity || 1,
          shopId: prod.productShopId ? new Types.ObjectId(prod.productShopId) : undefined,
          lineTotal: finalPrice * (a.quantity || 1),
        }
      ],
      orderSubtotal: finalPrice,
      orderShippingFee: 30000,
      orderTotalAmount: finalPrice + 30000,
      orderStatus: 0, // PENDING (chưa giao)
      orderPaymentMethod: 'wallet',
      orderPaymentStatus: 'pending',
      orderShippingAddress: {
        name: address.name,
        phone: address.phone,
        label: address.label,
        country: address.country,
        province: address.province,
        ward: address.ward,
        street: address.street,
        location: address.location,
      },
      orderNote: undefined,
      createdAt: a.finalizedAt ? new Date(a.finalizedAt) : nowDate,
      updatedAt: nowDate,
    };

    // Insert the order
    const inserted = await OrderModel.create(orderDoc);

    // Mark auction as finalized
    await AuctionModel.updateOne(
      { _id: auctionId },
      {
        $set: {
          finalState: 'finalized',
          finalWinnerId: winnerId,
          finalPrice: finalPrice,
          finalizedAt: nowDate,
        },
      }
    );

    console.log(`Auction ${auctionId} finalized: winner=${winnerId}, price=${finalPrice}, order=${inserted._id}`);
    return true;
  } catch (err) {
    console.error("processAuction error for", auctionId, err);
    // Try to revert claim
    try {
      await AuctionModel.updateOne(
        { _id: auctionId },
        { $set: { finalState: "pending" } }
      );
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

// --- Scheduling helpers ---------------------------------------------------
const timers: Record<string, NodeJS.Timeout> = {};

export async function scheduleAuctionTimer(auctionId: string, when: Date) {
  const now = Date.now();
  const runAt = when.getTime();
  const ms = Math.max(0, runAt - now);

  // Clear existing
  if (timers[auctionId]) clearTimeout(timers[auctionId]);

  timers[auctionId] = setTimeout(async () => {
    try {
      const a = await AuctionModel.findById(auctionId).lean();
      if (a) await processAuction(a as any);
    } catch (err) {
      console.error("scheduled processAuction error", auctionId, err);
    } finally {
      delete timers[auctionId];
    }
  }, ms);
}

export async function startScheduler(scanWindowSec = 3600) {
  // Schedule auctions that end within next scanWindowSec seconds
  const now = new Date();
  const until = new Date(now.getTime() + scanWindowSec * 1000);
  const docs = await AuctionModel.find({
    endsAt: { $gte: now, $lte: until },
    $or: [
      { finalState: "pending" },
      { finalState: { $exists: false } },
      { finalState: null },
    ],
  }).lean();
  
  for (const d of docs) {
    await scheduleAuctionTimer(String(d._id), new Date(d.endsAt));
  }
}

export function stopScheduler() {
  for (const k of Object.keys(timers)) {
    clearTimeout(timers[k]);
    delete timers[k];
  }
}

export default finalizeEndedAuctions;
