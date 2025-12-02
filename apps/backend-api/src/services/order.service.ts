import mongoose, { Types } from 'mongoose';
import OrderModel from '../models/order.model';
import { UserModel } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { AuctionModel } from '../models/auction.model';
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_STATUS,
} from '../constants/order.constants';

/**
 * Create an order (or orders) from a prepared orderDoc array/object and commit
 * payment via user's wallet. Optionally update auction finalization state inside
 * the same DB transaction when `auctionId` is provided.
 *
 * Throws on failure; returns inserted orders on success.
 */
export async function createOrderFromAuction(
  orderDocs: any[] | any,
  opts: { auctionId?: string; paymentReference?: string } = {}
) {
  const docsArray = Array.isArray(orderDocs) ? orderDocs : [orderDocs];

  const session = await mongoose.startSession();
  let inserted: any[] = [];
  try {
    // Normalize/ cast important ids so documents are stored with correct types
    for (const od of docsArray) {
      try {
        if (od && od.orderBuyerId) od.orderBuyerId = new Types.ObjectId(String(od.orderBuyerId));
      } catch (e) {
        // leave as-is
      }
      if (Array.isArray(od.orderItems)) {
        for (const it of od.orderItems) {
          if (it && it.productId) {
            try {
              it.productId = new Types.ObjectId(String(it.productId));
            } catch (e) {
              // leave as-is (could be null)
            }
          }
        }
      }
    }

    await session.withTransaction(async () => {
      console.log('createOrderFromAuction: inserting orders', docsArray.map((d: any) => ({ orderBuyerId: d.orderBuyerId, total: d.orderTotalAmount })));
      inserted = await OrderModel.insertMany(docsArray, { session });
      console.log('createOrderFromAuction: inserted orders', inserted.map((d: any) => String(d._id)));

      // Total deduction grouped by buyer (for auction flow there's usually single buyer)
      for (const od of docsArray) {
        const amount = Number(od.orderTotalAmount || 0);
        const buyerOid = od.orderBuyerId;

        if (od.orderPaymentMethod === PAYMENT_METHOD.WALLET) {
          const txId = opts.paymentReference || od.orderPaymentReference || `WALLET-TX-${Date.now()}`;
          const deductionRecord: any = {
            amount: -amount,
            currency: 'VND',
            bank: undefined,
            transactionId: txId,
            status: 'completed',
            createdAt: new Date(),
          };

          const res = await UserModel.updateOne(
            { _id: buyerOid, 'userWallet.balance': { $gte: amount } },
            {
              $inc: { 'userWallet.balance': -amount },
              $push: { 'userWallet.topups': deductionRecord },
              $set: { 'userWallet.updatedAt': new Date() },
            },
            { session }
          ).exec();

          if (!res.matchedCount && !res.modifiedCount) {
            throw new Error('INSUFFICIENT_FUNDS');
          }
        }

        // decrement product quantities if productId present
        if (Array.isArray(od.orderItems)) {
          for (const it of od.orderItems) {
            if (it && it.productId) {
              await ProductModel.updateOne(
                { _id: it.productId },
                { $inc: { productQuantity: -it.qty } }
              ).session(session);
            }
          }
        }
      }

      // If auctionId provided, mark auction as paid and set final fields
      if (opts.auctionId) {
        const first = docsArray[0];
        const winnerId = String(first.orderBuyerId);
        const finalPrice = Number(first.orderTotalAmount || 0);
        await AuctionModel.updateOne(
          { _id: opts.auctionId },
          {
            $set: {
              finalState: 'paid',
              finalWinnerId: winnerId,
              finalPrice,
              finalizedAt: new Date(),
            },
          }
        ).session(session);
      }
    });
  } finally {
    session.endSession();
  }

  return inserted;
}

export default { createOrderFromAuction };
