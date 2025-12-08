import NegotiationModel from "../../models/negotiation.model";
import { NEGOTIATION_STATUS } from "../../constants/product.constants";
import type { Request, Response } from "express";
import { Types, default as mongoose } from "mongoose";
import { sendSuccess, sendError } from "../../utils/response";
import { findProductById } from "../../services/product.service";
import { UserModel } from "../../models/user.model";
import OrderModel from "../../models/order.model";
import ShipmentModel from "../../models/shipment.model";
import { ProductModel, IProduct } from "../../models/product.model";
import { AuctionModel } from "../../models/auction.model";
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPMENT_STATUS,
  orderStatusNameToValue,
} from "../../constants/order.constants";

import { createZaloPayPayment } from "./payment.controller";

// GET /api/orders?status=<name|number>&page=&limit=
export async function listOrders(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const q: any = req.query || {};
    const statusQ = q.status;
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit || 20)));

    const filter: any = { orderBuyerId: new Types.ObjectId(String(userId)) };
    if (
      statusQ !== undefined &&
      statusQ !== null &&
      String(statusQ).trim() !== ""
    ) {
      let val: number = orderStatusNameToValue(statusQ);
      if (typeof statusQ === "string" && /^[0-9]+$/.test(statusQ))
        val = Number(statusQ);
      filter.orderStatus = val;
    }

    const total = await OrderModel.countDocuments(filter);
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const orderIds = orders.map((o: any) => o._id);
    const shipments = await ShipmentModel.find({
      orderId: { $in: orderIds },
    }).lean();
    const shipMap: Record<string, any> = {};
    for (const s of shipments) shipMap[String(s.orderId)] = s;

    const out: any[] = [];
    try {
      const pairs = orders.map((o: any) => {
        const sellerIds = Array.isArray(o.orderSellerIds)
          ? o.orderSellerIds
          : [];
        return {
          orderId: String(o._id),
          sellerId: sellerIds[0] ? String(sellerIds[0]) : null,
        };
      });

      const sellerIdSet: string[] = Array.from(
        new Set(
          pairs.map((p) => p.sellerId).filter((s): s is string => Boolean(s))
        )
      );
      const orderIdSet = pairs.map((p) => p.orderId);

      const reviewedMap: Record<string, boolean> = {};
      if (sellerIdSet.length && orderIdSet.length) {
        const users = await UserModel.find({
          _id: { $in: sellerIdSet.map((s) => new Types.ObjectId(s)) },
          userComment: {
            $elemMatch: {
              by: new Types.ObjectId(String(userId)),
              orderId: { $in: orderIdSet.map((id) => new Types.ObjectId(id)) },
            },
          },
        })
          .select("userComment")
          .lean();

        for (const u of users) {
          const comments = Array.isArray((u as any).userComment)
            ? (u as any).userComment
            : [];
          for (const c of comments) {
            if (!c || !c.orderId) continue;
            if (String(c.by) === String(userId))
              reviewedMap[String(c.orderId)] = true;
          }
        }
      }

      for (const o of orders) {
        const id = String(o._id);
        out.push({
          id,
          order: { ...o, isReviewed: !!reviewedMap[id] },
          shipment: shipMap[id] || null,
        });
      }
    } catch (e) {
      console.error("listOrders: failed to compute isReviewed", e);
      for (const o of orders) {
        const id = String(o._id);
        out.push({
          id,
          order: { ...o, isReviewed: false },
          shipment: shipMap[id] || null,
        });
      }
    }

    return sendSuccess(res, { page, limit, total, orders: out });
  } catch (err: any) {
    console.error("listOrders error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/orders/:id -> order detail
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    console.log("getOrderDetail: found order", order);
    if (!order) return sendError(res, 404, "Order not found");

    const isBuyer = String(order.orderBuyerId) === String(userId);
    if (!isBuyer) return sendError(res, 403, "Forbidden");

    const shipment = await ShipmentModel.findOne({ orderId: order._id }).lean();

    let sellerBasic: any = null;
    try {
      const sellerIds = Array.isArray(order.orderSellerIds)
        ? order.orderSellerIds
        : [];
      if (sellerIds.length) {
        const s = await UserModel.findById(String(sellerIds[0]))
          .select("userName userAvatar")
          .lean();
        if (s)
          sellerBasic = {
            id: String((s as any)._id),
            userName: (s as any).userName || "",
            userAvatar: (s as any).userAvatar || "",
          };
      }
    } catch (e) {
      console.error("getOrderDetail: failed to fetch seller basic info", e);
    }

    let isReviewed = false;
    try {
      const sellerIds: string[] = Array.isArray(order.orderSellerIds)
        ? order.orderSellerIds.map((id: any) => String(id))
        : [];
      if (sellerIds.length) {
        console.log("orderIds", order._id, "userId", userId);
        const match = await UserModel.findOne({
          _id: { $in: sellerIds.map((s) => new Types.ObjectId(s)) },
          userComment: {
            $elemMatch: {
              by: new Types.ObjectId(String(userId)),
              orderId: new Types.ObjectId(String(order._id)),
            },
          },
        })
          .select("_id")
          .lean();
        isReviewed = !!match;
        order.isReviewed = isReviewed;
      }
    } catch (e) {
      console.error("getOrderDetail: failed to determine isReviewed", e);
      isReviewed = false;
    }

    return sendSuccess(res, {
      order: { id: String(order._id), ...order },
      shipment: shipment || null,
      seller: sellerBasic,
    });
  } catch (err: any) {
    console.error("getOrderDetail error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/orders/by-ref/:ref -> find order by payment reference for current buyer
/* Removed getOrderByPaymentRef: not needed per latest requirements. */

type PreviewItem = { productId: string; qty?: number };

// POST /api/orders/preview
export async function previewOrder(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const body = req.body || {};
    const items: PreviewItem[] = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return sendError(res, 400, "Missing items to preview");

    const normalized = items.map((it) => ({
      productId: String(it.productId),
      qty: Math.max(1, Number(it.qty) || 1),
    }));

    const proms = normalized.map((it) => findProductById(it.productId));
    const prods = await Promise.all(proms);

    // If this preview is for a negotiation payment reference, try to load the negotiation
    // Accept both formats: "NEGOTIATION-<id>" and raw 24-hex ObjectId string
    let negotiationOverride: any = null;
    try {
      const paymentRef = String((body as any).paymentReference || "").trim();
      let nid: string | null = null;
      if (paymentRef.startsWith("NEGOTIATION-"))
        nid = paymentRef.replace("NEGOTIATION-", "");
      else if (/^[a-fA-F0-9]{24}$/.test(paymentRef)) nid = paymentRef;
      console.log("previewOrder: paymentRef", paymentRef, "nid", nid);
      if (nid) {
        const neg = await NegotiationModel.findById(nid).lean<any>();
        if (neg && Number(neg.status) === NEGOTIATION_STATUS.ACCEPTED) {
          negotiationOverride = neg;
        }
      }
      // Fallback: if no paymentReference given or it didn't resolve to a negotiation id,
      // try to find an accepted negotiation for the current buyer + any item productId.
      if (
        !negotiationOverride &&
        Array.isArray(normalized) &&
        normalized.length
      ) {
        try {
          for (const it of normalized) {
            if (!it || !it.productId) continue;
            const candidate = await NegotiationModel.findOne({
              productId: it.productId,
              buyerId: new Types.ObjectId(String(userId)),
              status: NEGOTIATION_STATUS.ACCEPTED,
            })
              .sort({ acceptedAt: -1, updatedAt: -1 })
              .lean<any>();
            if (candidate) {
              negotiationOverride = candidate;
              console.log(
                "previewOrder: fallback found negotiation",
                String(candidate._id),
                "for product",
                it.productId
              );
              break;
            }
          }
        } catch (e) {
          // non-fatal
          console.warn("previewOrder: negotiation fallback search failed", e);
        }
      }
    } catch (e) {
      // non-fatal
    }

    // If this request originated from an auction payload, override the
    // product price with the auction final price so buyer is charged correctly.
    if ((body as any).__auctionFinalPrice) {
      const auctionPrice = Number((body as any).__auctionFinalPrice || 0);
      for (let i = 0; i < normalized.length; i++) {
        try {
          if (prods[i]) (prods[i] as any).productPrice = auctionPrice;
        } catch (e) {
          // ignore
        }
      }
    }

    const byShop: Record<
      string,
      { shopId: string; shopName?: string; items: any[] }
    > = {};
    let totalPrice = 0;

    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i];
      const p = prods[i] as any;
      if (!p) continue;

      // If negotiation override applies and this item matches the negotiation's product,
      // use the negotiated price and quantity instead of the product's listed price.
      let price = typeof p.productPrice === "number" ? p.productPrice : 0;
      let qty = it.qty || 1;
      console.log("previewOrder item", i, "productId", it.productId);
      console.log("  base price", price, "qty", qty);
      console.log("  negotiationOverride", negotiationOverride);
      if (
        negotiationOverride &&
        String(negotiationOverride.productId) === String(it.productId)
      ) {
        console.log(negotiationOverride.offeredPrice);
        price = Number(negotiationOverride.offeredPrice || price);
        qty = Number(negotiationOverride.quantity || qty);
      }

      const lineTotal = price * qty;
      totalPrice += lineTotal;

      const shopId = String(p.productShopId || "");
      const shopKey = shopId || "unknown";
      if (!byShop[shopKey])
        byShop[shopKey] = {
          shopId: shopId || "",
          shopName: undefined,
          items: [],
        };

      const imageUrl = Array.isArray(p.productMedia)
        ? p.productMedia[0] ?? ""
        : p.productMedia ?? "";
      byShop[shopKey].items.push({
        productId: String(p._id),
        name: p.productName || "",
        shortDescription: p.productDescription || "",
        imageUrl,
        price,
        qty,
        lineTotal,
      });
    }

    const shopIds = Object.values(byShop)
      .map((s) => s.shopId)
      .filter((id) => id && Types.ObjectId.isValid(String(id)));
    const uniqueShopIds = Array.from(new Set(shopIds));
    if (uniqueShopIds.length) {
      const shops = await UserModel.find({
        _id: { $in: uniqueShopIds.map((s) => new Types.ObjectId(s)) },
      })
        .select("userName")
        .lean();
      const mapName: Record<string, string> = {};
      for (const s of shops)
        mapName[String((s as any)._id)] = (s as any).userName || "";
      for (const k of Object.keys(byShop)) {
        const sid = byShop[k].shopId;
        if (sid && mapName[sid]) byShop[k].shopName = mapName[sid];
      }
    }

    const shopsList = Object.keys(byShop).map((k) => ({
      shopId: byShop[k].shopId,
      shopName: byShop[k].shopName,
      items: byShop[k].items,
    }));

    const paymentMethods = [
      { code: "wallet", label: "Ví của tôi" },
      { code: "cod", label: "Thanh toán khi nhận hàng" },
      { code: "zalopay", label: "ZaloPay" },
    ];

    const u = await UserModel.findById(String(userId))
      .select("userAddress userWallet")
      .lean<any>();
    const addresses = Array.isArray(u?.userAddress) ? u.userAddress : [];
    const walletBalance = u?.userWallet?.balance ?? 0;

    const shippingFee = 0;
    const grandTotal = totalPrice + shippingFee;

    const resp = {
      items: shopsList,
      paymentMethods,
      addresses,
      totalPrice,
      shippingFee,
      grandTotal,
      walletBalance,
    };

    return sendSuccess(res, resp);
  } catch (err: any) {
    console.error("previewOrder error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/orders/place -> create an order and save to DB
export async function placeOrder(req: Request, res: Response) {
  let grandTotal = 0;

  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const body = req.body || {};

    // If this request is for creating an order from an auction, allow a
    // simplified payload: { auctionId, paymentMethod?, shippingAddressId? }
    // We will fetch auction/product/user/address server-side and populate
    // `body.items` so the existing flow can continue unchanged.
    if (body.auctionId) {
      const auctionId = String(body.auctionId);
      const auction = await AuctionModel.findById(auctionId).lean();
      if (!auction) return sendError(res, 400, "Auction not found");

      // Only allow the auction winner to place the order for that auction
      if (
        !auction.finalWinnerId ||
        String(auction.finalWinnerId) !== String(userId)
      ) {
        return sendError(res, 403, "Only auction winner may place this order");
      }

      // Find related product
      const auctionProduct = await ProductModel.findOne({
        "productAuction.auctionId": auction._id,
      }).lean();
      if (!auctionProduct)
        return sendError(res, 400, "Product for auction not found");

      // Build minimal items payload for the existing flow
      body.items = [
        {
          productId: String((auctionProduct as any)._id),
          qty: auction.quantity || 1,
        },
      ];

      // Persist the auction final price so we can override the product price later
      (body as any).__auctionFinalPrice = Number(
        auction.finalPrice || auction.currentPrice || 0
      );

      // Default payment method to wallet if not provided
      if (!body.paymentMethod) body.paymentMethod = PAYMENT_METHOD.WALLET;

      // If shipping address not provided, attempt to use user's default address
      if (!body.shippingAddressId && !body.shippingAddress) {
        const u = await UserModel.findById(String(userId))
          .select("userAddress")
          .lean<any>();
        const def =
          (u?.userAddress || []).find((a: any) => a.isDefault) ||
          (u?.userAddress && u.userAddress[0]);
        if (def) body.shippingAddressId = def._id;
      }
    }

    const items: { productId: string; qty?: number }[] = Array.isArray(
      body.items
    )
      ? body.items
      : [];
    const paymentMethod = String(body.paymentMethod || "").toLowerCase();
    const shippingAddressId = body.shippingAddressId;
    const shippingAddressObj = body.shippingAddress;

    if (!items.length) return sendError(res, 400, "Missing items");
    if (!paymentMethod) return sendError(res, 400, "Missing paymentMethod");

    if (paymentMethod === PAYMENT_METHOD.ZALOPAY) {
      return createZaloPayPayment(req, res);
    }

    if (!Object.values(PAYMENT_METHOD).includes(paymentMethod as any))
      return sendError(res, 400, "Invalid paymentMethod");

    const normalized = items.map((it) => ({
      productId: String(it.productId),
      qty: Math.max(1, Number(it.qty) || 1),
    }));

    // fetch products
    const proms = normalized.map((it) => findProductById(it.productId));
    const prods = await Promise.all(proms);
    const missing = normalized
      .filter((_, i) => !prods[i])
      .map((it) => it.productId);
    if (missing.length)
      return sendError(res, 400, "Some products not found", { missing });

    // If this order is for a negotiation (paymentReference could be plain id or NEGOTIATION-<id>),
    // load the negotiation and enforce the negotiated price/qty for the matching item.
    let negotiationOverride: any = null;
    try {
      const paymentRef = String((body as any).paymentReference || "").trim();
      let nid: string | null = null;
      if (paymentRef.startsWith("NEGOTIATION-"))
        nid = paymentRef.replace("NEGOTIATION-", "");
      else if (/^[a-fA-F0-9]{24}$/.test(paymentRef)) nid = paymentRef;

      if (nid) {
        const neg = await NegotiationModel.findById(nid).lean<any>();
        if (!neg) return sendError(res, 400, "Negotiation not found");
        if (Number(neg.status) !== NEGOTIATION_STATUS.ACCEPTED)
          return sendError(res, 400, "Negotiation is not accepted for payment");
        negotiationOverride = neg;
      }
      // Fallback: if FE didn't send a paymentReference, try to find an accepted negotiation
      // for this buyer and any of the requested products.
      if (
        !negotiationOverride &&
        Array.isArray(normalized) &&
        normalized.length
      ) {
        try {
          for (const it of normalized) {
            if (!it || !it.productId) continue;
            const candidate = await NegotiationModel.findOne({
              productId: it.productId,
              buyerId: new Types.ObjectId(String(userId)),
              status: NEGOTIATION_STATUS.ACCEPTED,
            })
              .sort({ acceptedAt: -1, updatedAt: -1 })
              .lean<any>();
            if (candidate) {
              negotiationOverride = candidate;
              console.log(
                "placeOrder: fallback found negotiation",
                String(candidate._id),
                "for product",
                it.productId
              );
              break;
            }
          }
        } catch (e) {
          console.warn("placeOrder: negotiation fallback search failed", e);
        }
      }
    } catch (e) {
      console.warn("load negotiation failed", e);
    }

    for (let i = 0; i < normalized.length; i++) {
      const p = prods[i] as any;
      let qty = normalized[i].qty;
      // apply negotiation quantity if override applies to this product
      if (
        negotiationOverride &&
        String(negotiationOverride.productId) ===
          String(normalized[i].productId)
      ) {
        qty = Number(negotiationOverride.quantity || qty);
      }
      if (p.productQuantity < qty) {
        return sendError(
          res,
          400,
          `Sản phẩm "${p.productName}" không đủ số lượng (chỉ còn ${p.productQuantity})`
        );
      }
    }

    const groups: Record<string, { items: any[]; subtotal: number }> = {};
    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i];
      const p = prods[i] as any;

      // default price/qty from product
      let price = typeof p.productPrice === "number" ? p.productPrice : 0;
      let qty = it.qty || 1;
      // apply negotiation override if applicable
      if (
        negotiationOverride &&
        String(negotiationOverride.productId) === String(it.productId)
      ) {
        price = Number(negotiationOverride.offeredPrice || price);
        qty = Number(negotiationOverride.quantity || qty);
      }

      const lineTotal = price * qty;

      const imageUrl = Array.isArray(p.productMedia)
        ? p.productMedia[0] ?? ""
        : p.productMedia ?? "";
      const shopId = p.productShopId ? String(p.productShopId) : "unknown";
      if (!groups[shopId]) groups[shopId] = { items: [], subtotal: 0 };
      groups[shopId].items.push({
        productId: p._id,
        name: p.productName || "",
        imageUrl,
        price,
        qty,
        shopId: shopId === "unknown" ? null : shopId,
        lineTotal,
      });
      groups[shopId].subtotal += lineTotal;
    }

    let shippingAddress: any = null;
    if (shippingAddressId) {
      const u = await UserModel.findById(String(userId))
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

    const shippingFeesMap =
      body.shippingFees && typeof body.shippingFees === "object"
        ? body.shippingFees
        : null;
    const totalShippingFee = Number(body.shippingFee || 0) || 0;

    const shopKeys = Object.keys(groups);
    const groupCount = shopKeys.length || 1;

    const computedShippingFees: Record<string, number> = {};
    if (shippingFeesMap) {
      for (const k of shopKeys)
        computedShippingFees[k] = Number(shippingFeesMap[k] || 0) || 0;
    } else if (totalShippingFee > 0) {
      const base = Math.floor(totalShippingFee / groupCount);
      let remainder = totalShippingFee - base * groupCount;
      for (let i = 0; i < shopKeys.length; i++) {
        const k = shopKeys[i];
        computedShippingFees[k] =
          base + (i === shopKeys.length - 1 ? remainder : 0);
      }
    } else {
      for (const k of shopKeys) computedShippingFees[k] = 0;
    }

    grandTotal = 0;
    for (const k of shopKeys) {
      grandTotal += (groups[k].subtotal || 0) + (computedShippingFees[k] || 0);
    }

    let walletBalance = 0;
    if (paymentMethod === PAYMENT_METHOD.WALLET) {
      const ubal = await UserModel.findById(String(userId))
        .select("userWallet")
        .lean<any>();
      console.log("ubal", ubal);
      walletBalance = ubal?.userWallet?.balance ?? 0;
      if (walletBalance < grandTotal) {
        return sendError(res, 402, "Insufficient wallet balance", {
          walletBalance,
          required: grandTotal,
        });
      }
    }

    const orderDocs: any[] = [];
    for (const k of shopKeys) {
      const group = groups[k];
      const shopId = k === "unknown" ? null : k;
      const orderObj: any = {
        orderBuyerId: userId,
        orderSellerIds: shopId ? [new Types.ObjectId(shopId)] : [],
        orderItems: group.items,
        orderSubtotal: group.subtotal,
        orderShippingFee: computedShippingFees[k] || 0,
        orderTotalAmount:
          (group.subtotal || 0) + (computedShippingFees[k] || 0),
        orderStatus: ORDER_STATUS.PENDING,
        orderPaymentMethod: paymentMethod,
        orderPaymentStatus:
          paymentMethod === PAYMENT_METHOD.WALLET
            ? PAYMENT_STATUS.PAID
            : PAYMENT_STATUS.PENDING,
        orderShippingAddress: shippingAddress,
        orderNote: body.note,
        orderPaymentReference: body.paymentReference,
      };
      orderDocs.push(orderObj);
    }

    const session = await mongoose.startSession();
    let inserted: any[] = [];
    try {
      await session.withTransaction(async () => {
        inserted = await OrderModel.insertMany(orderDocs, { session });

        if (paymentMethod === PAYMENT_METHOD.WALLET) {
          const txId = body.paymentReference || `WALLET-TX-${Date.now()}`;
          const deductionRecord: any = {
            amount: -grandTotal,
            currency: "VND",
            bank: undefined,
            transactionId: txId,
            status: "completed",
            createdAt: new Date(),
          };

          const res = await UserModel.updateOne(
            { _id: userId, "userWallet.balance": { $gte: grandTotal } },
            {
              $inc: { "userWallet.balance": -grandTotal },
              $push: { "userWallet.topups": deductionRecord },
              $set: { "userWallet.updatedAt": new Date() },
            },
            { session }
          ).exec();

          if (!res.matchedCount && !res.modifiedCount) {
            throw new Error("Insufficient wallet balance at commit time");
          }
        }

        for (const item of normalized) {
          await ProductModel.updateOne(
            { _id: item.productId },
            { $inc: { productQuantity: -item.qty } }
          ).session(session);
        }
      });
    } finally {
      session.endSession();
    }

    // After successful transaction: if any inserted orders are linked to negotiations,
    // mark those negotiations as purchased when payment status is PAID
    try {
      for (const od of inserted) {
        const ref = String(
          od.orderPaymentReference || od.paymentReference || ""
        ).trim();
        let negId: string | null = null;
        if (ref.startsWith("NEGOTIATION-"))
          negId = ref.replace("NEGOTIATION-", "");
        else if (/^[a-fA-F0-9]{24}$/.test(ref)) negId = ref;

        if (negId && od.orderPaymentStatus === PAYMENT_STATUS.PAID) {
          await NegotiationModel.findByIdAndUpdate(negId, {
            status: NEGOTIATION_STATUS.PURCHASED,
            purchasedAt: new Date(),
          });
        }
      }
    } catch (e) {
      console.warn(
        "Failed to mark negotiation purchased after wallet payment",
        e
      );
    }

    // If we used a negotiation override (fallback or explicit) for this placeOrder,
    // mark that negotiation as PURCHASED as the buyer has just placed the order.
    try {
      if (negotiationOverride && negotiationOverride._id) {
        await NegotiationModel.findByIdAndUpdate(
          String(negotiationOverride._id),
          {
            status: NEGOTIATION_STATUS.PURCHASED,
            purchasedAt: new Date(),
          }
        );
      }
    } catch (e) {
      console.warn(
        "Failed to mark negotiation purchased for negotiationOverride",
        e
      );
    }

    return sendSuccess(
      res,
      { orders: inserted.map((d: any) => ({ id: String(d._id), order: d })) },
      201
    );
  } catch (err: any) {
    console.error("placeOrder error", err);
    if (
      err &&
      typeof err.message === "string" &&
      err.message.includes("Insufficient wallet balance")
    ) {
      return sendError(res, 402, "Insufficient wallet balance at commit time", {
        walletBalance: null,
        required: grandTotal,
      });
    }

    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/orders/:id/confirm-delivery
export async function confirmDelivery(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId);
    if (!order) return sendError(res, 404, "Order not found");

    if (String(order.orderBuyerId) !== String(userId))
      return sendError(res, 403, "Forbidden");

    const shipment: any = await ShipmentModel.findOne({ orderId: order._id });
    if (!shipment)
      return sendError(res, 400, "No shipment found for this order");

    if (
      shipment.currentStatus !== undefined &&
      shipment.currentStatus !== null &&
      shipment.currentStatus !== SHIPMENT_STATUS.DELIVERED
    ) {
      return sendError(res, 400, "Shipment not delivered yet");
    }

    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { orderStatus: ORDER_STATUS.DELIVERED } }
    );

    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    console.error("confirmDelivery error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/orders/:id/return
export async function submitReturnRequest(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const body = req.body || {};
    const media = Array.isArray(body.media)
      ? body.media.filter((m: any) => typeof m === "string" && String(m).trim())
      : [];
    const description = String(body.description || "").trim();

    if (!media.length)
      return sendError(res, 400, "Missing media evidence (video/img)");
    if (!description) return sendError(res, 400, "Missing description");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");
    if (String(order.orderBuyerId) !== String(userId))
      return sendError(res, 403, "Not the buyer of this order");

    if (order.orderStatus !== ORDER_STATUS.DELIVERED)
      return sendError(res, 400, "Order not eligible for return");

    const reqDoc: any = {
      status: "pending",
      media,
      description,
      createdAt: new Date(),
      refundProcessed: false,
      refundAmount: 0,
    };

    await OrderModel.updateOne(
      { _id: orderId },
      { $set: { returnRequest: reqDoc, orderStatus: ORDER_STATUS.CANCELLED } }
    );

    return sendSuccess(res, { ok: true, returnRequest: reqDoc }, 201);
  } catch (err: any) {
    console.error("submitReturnRequest error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/orders/:id/rate
export async function rateShop(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(String(orderId)))
      return sendError(res, 400, "Invalid order id");

    const body = req.body || {};
    const rate = Number(body.rate || 0);
    const description = String(body.description || "").trim();
    const media = Array.isArray(body.media)
      ? body.media.filter((m: any) => typeof m === "string")
      : [];

    if (!rate || rate < 1 || rate > 5)
      return sendError(res, 400, "Invalid rate value");

    const order = await OrderModel.findById(orderId).exec();
    if (!order) return sendError(res, 404, "Order not found");
    if (String(order.orderBuyerId) !== String(userId))
      return sendError(res, 403, "Not the buyer of this order");
    if (order.orderStatus !== ORDER_STATUS.DELIVERED)
      return sendError(res, 400, "Order not delivered yet");

    const sellerIds = Array.isArray(order.orderSellerIds)
      ? order.orderSellerIds
      : [];
    if (!sellerIds.length)
      return sendError(res, 400, "No seller associated with this order");

    const sellerId = String(sellerIds[0]);

    const comment = {
      by: new Types.ObjectId(userId),
      rate,
      description,
      media,
      orderId: new Types.ObjectId(orderId),
      createdAt: new Date(),
    } as any;

    const seller = await UserModel.findById(sellerId).exec();
    if (!seller) return sendError(res, 404, "Seller not found");

    seller.userComment = Array.isArray(seller.userComment)
      ? seller.userComment
      : [];
    seller.userComment.push(comment);

    const sum = (seller.userComment || []).reduce(
      (acc: number, c: any) => acc + (Number(c.rate) || 0),
      0
    );
    const avg =
      seller.userComment.length && sum > 0
        ? sum / seller.userComment.length
        : 0;
    seller.userRate = Math.round((avg + Number.EPSILON) * 100) / 100; // round to 2 decimals

    await seller.save();

    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    console.error("rateShop error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/orders/:id/cancel
export async function cancelOrder(req: Request, res: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, 404, "Order not found");
    }

    if (String(order.orderBuyerId) !== String(userId)) {
      await session.abortTransaction();
      return sendError(res, 403, "Not the buyer of this order");
    }

    if (order.orderLocked) {
      await session.abortTransaction();
      return sendError(res, 400, "Order already confirmed by shop");
    }
    if (order.orderStatus !== ORDER_STATUS.PENDING) {
      await session.abortTransaction();
      return sendError(res, 400, "Order cannot be cancelled at this stage");
    }

    // Update Status
    order.orderStatus = ORDER_STATUS.CANCELLED;
    await order.save({ session });

    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        await ProductModel.updateOne(
          { _id: item.productId },
          { $inc: { productQuantity: +item.qty } }
        ).session(session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("cancelOrder error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// PATCH /api/orders/:id/shipping -> update shipping address for an order (buyer only)
export async function updateOrderShipping(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const body = req.body || {};
    const shippingAddressId = body.shippingAddressId;
    const shippingAddressObj = body.shippingAddress;

    if (!shippingAddressId && !shippingAddressObj)
      return sendError(
        res,
        400,
        "Missing shipping address or shippingAddressId"
      );

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");
    if (String(order.orderBuyerId) !== String(userId))
      return sendError(res, 403, "Forbidden");

    // Only allow updating shipping for orders created from auctions (optional guard)
    if (
      order.orderPaymentReference &&
      typeof order.orderPaymentReference === "string" &&
      !order.orderPaymentReference.startsWith("AUCTION-")
    ) {
      // still allow update for regular orders, but if you want to restrict to auctions remove this block
    }

    let shippingAddress: any = null;
    if (shippingAddressId) {
      const u = await UserModel.findById(String(userId))
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
    }

    if (!shippingAddress)
      return sendError(res, 400, "Invalid shipping address");

    await OrderModel.updateOne(
      { _id: orderId },
      { $set: { orderShippingAddress: shippingAddress } }
    );

    const updated = await OrderModel.findById(orderId).lean();
    return sendSuccess(res, { order: updated });
  } catch (err: any) {
    console.error("updateOrderShipping error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
