import NegotiationModel from "../models/negotiation.model";
import { NEGOTIATION_STATUS } from "../constants/product.constants";
import { ProductModel, IProduct } from "../models/product.model";
import { UserModel } from "../models/user.model";
import OrderModel from "../models/order.model";
import mongoose from "mongoose";
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_STATUS,
} from "../constants/order.constants";
import { USER_ROLE } from "../constants/user.constants";
import { Types } from "mongoose";

export async function createNegotiation(
  productId: string,
  buyerId: string,
  offeredPrice: number,
  message?: string
) {
  // validate product exists and is negotiable
  const p: any = await ProductModel.findById(productId).lean();
  if (!p) throw new Error("Product not found");
  // productPriceType === 2 means negotiable
  if (p.productPriceType !== 2) throw new Error("Product is not negotiable");

  const sellerId = p.productShopId ? String(p.productShopId) : null;
  if (!sellerId) throw new Error("Product has no seller");

  const doc = await NegotiationModel.create({
    productId: new Types.ObjectId(productId),
    buyerId: new Types.ObjectId(buyerId),
    sellerId: new Types.ObjectId(sellerId),
    offeredPrice,
    message,
  });
  return doc;
}

export async function listNegotiationsForProduct(productId: string) {
  return NegotiationModel.find({ productId }).sort({ createdAt: -1 }).lean();
}

export async function respondToNegotiation(
  negotiationId: string,
  sellerId: string,
  action: "accept" | "reject"
) {
  const n: any = await NegotiationModel.findById(negotiationId);
  if (!n) throw new Error("Negotiation not found");

  // allow if caller is the product seller OR an admin user
  const caller = await UserModel.findById(sellerId).lean();
  const callerAny: any = caller;
  const callerIsAdmin = callerAny && callerAny.userRole === USER_ROLE.ADMIN;
  const callerIsShop = callerAny && callerAny.userRole === USER_ROLE.SHOP;
  // allow admin, or shop owner (callerIsShop && matches seller), or exact seller id
  if (
    !(
      callerIsAdmin ||
      (callerIsShop && String(n.sellerId) === String(sellerId)) ||
      String(n.sellerId) === String(sellerId)
    )
  ) {
    throw new Error("Not authorized");
  }

  if (n.status !== NEGOTIATION_STATUS.PENDING)
    throw new Error("Negotiation already closed");
  if (action === "accept") {
    // create an order snapshot and attempt to deduct buyer's wallet atomically
    const product = await ProductModel.findById(n.productId).lean<IProduct>();
    const price = Number(n.offeredPrice || 0);

    // determine buyer's default shipping address (if any)
    const buyer = await UserModel.findById(String(n.buyerId))
      .select("userAddress")
      .lean<any>();
    const defaultAddress = Array.isArray(buyer?.userAddress)
      ? buyer.userAddress.find((a: any) => a.isDefault) ||
        buyer.userAddress[0] ||
        null
      : null;

    const orderDoc: any = {
      orderBuyerId: String(n.buyerId),
      orderSellerIds: [String(n.sellerId)],
      orderItems: [
        {
          productId: n.productId,
          name: (product && product.productName) || "Product",
          imageUrl:
            product && Array.isArray(product.productMedia)
              ? product.productMedia[0] || ""
              : product?.productMedia || "",
          price,
          qty: 1,
          shopId: n.sellerId,
          lineTotal: price,
        },
      ],
      orderSubtotal: price,
      orderShippingFee: 0,
      orderTotalAmount: price,
      orderStatus: ORDER_STATUS.PENDING,
      orderPaymentMethod: PAYMENT_METHOD.WALLET,
      orderPaymentStatus: PAYMENT_STATUS.PENDING,
      orderShippingAddress: defaultAddress,
      orderNote: `Order created from negotiation ${negotiationId}`,
      orderPaymentReference: `NEGOTIATION-${negotiationId}`,
    };

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await OrderModel.create([orderDoc], { session });

        // conditional deduction from buyer's wallet
        const buyerId = String(n.buyerId);
        const res = await UserModel.updateOne(
          {
            _id: buyerId,
            "userWallet.balance": { $gte: orderDoc.orderTotalAmount },
          },
          {
            $inc: { "userWallet.balance": -orderDoc.orderTotalAmount },
            $push: {
              "userWallet.topups": {
                amount: -orderDoc.orderTotalAmount,
                currency: "VND",
                transactionId: orderDoc.orderPaymentReference,
                status: "completed",
                createdAt: new Date(),
              },
            },
            $set: { "userWallet.updatedAt": new Date() },
          },
          { session }
        ).exec();

        if (!res.matchedCount && !res.modifiedCount) {
          // insufficient funds -> abort
          throw new Error("INSUFFICIENT_FUNDS");
        }
      });

      // success: mark negotiation accepted
      n.status = NEGOTIATION_STATUS.ACCEPTED;
      await n.save();
      return n;
    } catch (err: any) {
      const msg = (err && err.message) || "";
      if (msg.includes("INSUFFICIENT_FUNDS")) {
        // mark negotiation as rejected due to payment failure
        n.status = NEGOTIATION_STATUS.REJECTED;
        await n.save();
        throw new Error("Insufficient wallet balance for buyer");
      }

      // if other error, rethrow
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    n.status = NEGOTIATION_STATUS.REJECTED;
    await n.save();
    return n;
  }
}

export default {
  createNegotiation,
  listNegotiationsForProduct,
  respondToNegotiation,
};
