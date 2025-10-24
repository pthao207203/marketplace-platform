import { AuctionModel } from '../models/auction.model';
import OrderModel from '../models/order.model';
import User from '../models/user.model';
import mongoose from 'mongoose';
import { PAYMENT_METHOD } from '../constants/order.constants';

/**
 * Find auctions that ended and are still pending finalization.
 * For each auction: determine winner (last bid), create an order charged to winner's wallet,
 * and update auction.finalState atomically. This function is idempotent: it marks auctions as processing
 * before attempting payment so repeated runs don't double-charge.
 */
export async function finalizeEndedAuctions(limit = 20) {
  const now = new Date();

  // find candidate auctions: ended and still pending
  const candidates = await AuctionModel.find({ endsAt: { $lte: now }, finalState: 'pending' }).limit(limit).lean();
  if (!candidates || !candidates.length) return { processed: 0 };

  let processed = 0;

  for (const a of candidates) {
    const ok = await processAuction(a as any);
    if (ok) processed++;
  }

  return { processed };
}

// --- process single auction (extracted for reuse) -------------------------
async function processAuction(a: any) {
  const auctionId = String(a._id);

  // attempt to mark as 'processing' to claim this worker
  const claimed = await AuctionModel.updateOne({ _id: auctionId, finalState: 'pending' }, { $set: { finalState: 'processing' } });
  if (!claimed.matchedCount) return false; // someone else claimed it

  try {
    const bids = Array.isArray(a.bidHistory) ? a.bidHistory : [];
    if (!bids.length) {
      // no bids -> mark as no_bids
      await AuctionModel.updateOne({ _id: auctionId }, { $set: { finalState: 'no_bids', finalizedAt: new Date() } });
      return true;
    }

    // winner is the last bid entry
    const lastBid = bids[bids.length - 1];
    const winnerId = String(lastBid.userId);
    const finalPrice = lastBid.amount;

    // build order doc for winner: snapshot minimal product info from auction entry
    const orderDoc: any = {
      orderBuyerId: winnerId,
      orderSellerIds: [],
      orderItems: [
        {
          productId: null,
          name: a.title || 'Auction item',
          imageUrl: a.imageUrl || '',
          price: finalPrice,
          qty: a.quantity || 1,
          shopId: null,
          lineTotal: finalPrice * (a.quantity || 1),
        },
      ],
      orderSubtotal: finalPrice * (a.quantity || 1),
      orderShippingFee: 0,
      orderTotalAmount: finalPrice * (a.quantity || 1),
      orderStatus: 'PENDING',
      orderPaymentMethod: PAYMENT_METHOD.WALLET,
      orderPaymentStatus: 'PENDING',
      orderShippingAddress: null,
      orderNote: `Order created from auction ${auctionId}`,
      orderPaymentReference: `AUCTION-${auctionId}`,
    };

    // transaction: create order + deduct winner wallet atomically
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await OrderModel.create([orderDoc], { session });

        // conditional deduction
        const res = await User.updateOne(
          { _id: winnerId, 'userWallet.balance': { $gte: orderDoc.orderTotalAmount } },
          { $inc: { 'userWallet.balance': -orderDoc.orderTotalAmount }, $push: { 'userWallet.topups': { amount: -orderDoc.orderTotalAmount, currency: 'VND', transactionId: orderDoc.orderPaymentReference, status: 'completed', createdAt: new Date() } }, $set: { 'userWallet.updatedAt': new Date() } },
          { session }
        ).exec();

        if (!res.matchedCount && !res.modifiedCount) {
          // payment failed due to insufficient funds
          throw new Error('INSUFFICIENT_FUNDS');
        }

        // mark auction as paid
        await AuctionModel.updateOne({ _id: auctionId }, { $set: { finalState: 'paid', finalWinnerId: winnerId, finalPrice, finalizedAt: new Date() } }, { session });
      });

      return true;
    } catch (err) {
      // if the DB transaction threw INSUFFICIENT_FUNDS, mark auction as payment_failed
      const msg = (err && (err as any).message) || '';
      if (msg.includes('INSUFFICIENT_FUNDS')) {
        await AuctionModel.updateOne({ _id: auctionId }, { $set: { finalState: 'payment_failed', finalizedAt: new Date(), finalPrice } });
        return true;
      }

      // revert claim so another worker can attempt later
      await AuctionModel.updateOne({ _id: auctionId }, { $set: { finalState: 'pending' } });
      return false;
    } finally {
      session.endSession();
    }
  } catch (outerErr) {
    console.error('processAuction error for', auctionId, outerErr);
    // try to revert claim
    try {
      await AuctionModel.updateOne({ _id: auctionId }, { $set: { finalState: 'pending' } });
    } catch (e) {
      // ignore
    }
    return false;
  }
}

// --- scheduling helpers ---------------------------------------------------
const timers: Record<string, NodeJS.Timeout> = {};

export async function scheduleAuctionTimer(auctionId: string, when: Date) {
  const now = Date.now();
  const runAt = when.getTime();
  const ms = Math.max(0, runAt - now);

  // clear existing
  if (timers[auctionId]) clearTimeout(timers[auctionId]);

  timers[auctionId] = setTimeout(async () => {
    try {
      const a = await AuctionModel.findById(auctionId).lean();
      if (a) await processAuction(a as any);
    } catch (err) {
      console.error('scheduled processAuction error', auctionId, err);
    } finally {
      delete timers[auctionId];
    }
  }, ms);
}

export async function startScheduler(scanWindowSec = 3600) {
  // schedule auctions that end within next scanWindowSec seconds
  const now = new Date();
  const until = new Date(now.getTime() + scanWindowSec * 1000);
  const docs = await AuctionModel.find({ endsAt: { $gte: now, $lte: until }, finalState: 'pending' }).lean();
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
