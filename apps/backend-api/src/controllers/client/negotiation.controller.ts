import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import {
  createNegotiation,
  listNegotiationsForProduct,
} from "../../services/negotiation.service";
import NegotiationModel from "../../models/negotiation.model";
import OrderModel from "../../models/order.model";
import ProductModel from "../../models/product.model";
import { UserModel } from "../../models/user.model";
import { ORDER_STATUS } from "../../constants/order.constants";
import { Types } from "mongoose";

export async function createNegotiationHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const productId = req.params.id;
    const offeredPrice = Number(req.body.offeredPrice);
    const message = req.body.message;
    const quantity =
      typeof req.body.quantity !== "undefined"
        ? Number(req.body.quantity)
        : undefined;
    if (!productId || !offeredPrice || isNaN(offeredPrice))
      return sendError(res, 400, "Invalid product or price");

    const doc = await createNegotiation(
      productId,
      String(user.sub),
      offeredPrice,
      message,
      quantity
    );
    return sendSuccess(res, { negotiation: doc }, 201);
  } catch (err: any) {
    console.error("createNegotiation error", err);
    return sendError(res, 400, err?.message || "Error");
  }
}

export async function listNegotiationsHandler(req: Request, res: Response) {
  try {
    const productId = req.params.id;
    if (!productId) return sendError(res, 400, "Missing product id");
    const docs = await listNegotiationsForProduct(productId);
    return sendSuccess(res, { negotiations: docs });
  } catch (err: any) {
    console.error("listNegotiations error", err);
    return sendError(res, 500, "Server error");
  }
}

// GET /api/negotiations/received?page=&pageSize=
export async function listReceivedNegotiationsHandler(
  req: Request,
  res: Response
) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const userId = String(user.sub);

    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize ?? 20))
    );
    const skip = (page - 1) * pageSize;

    // Find delivered orders that have some payment reference (could be raw negotiation id or prefixed)
    const orderFilter: any = {
      orderStatus: ORDER_STATUS.DELIVERED,
      orderPaymentReference: { $exists: true, $ne: null },
    };

    const [orders, totalOrders] = await Promise.all([
      OrderModel.find(orderFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      OrderModel.countDocuments(orderFilter),
    ]);

    const negotiationIds = orders
      .map((o: any) => {
        const ref = String(o.orderPaymentReference || "").trim();
        if (!ref) return null;
        if (ref.startsWith("NEGOTIATION-"))
          return ref.replace("NEGOTIATION-", "");
        // if ref is plain ObjectId hex, accept it
        if (/^[a-fA-F0-9]{24}$/.test(ref)) return ref;
        return null;
      })
      .filter(Boolean);

    if (!negotiationIds.length) {
      return sendSuccess(res, {
        page,
        pageSize,
        total: totalOrders,
        items: [],
      });
    }

    // load negotiations and make sure current user is participant
    const negs = await NegotiationModel.find({
      _id: { $in: negotiationIds.map((id) => new Types.ObjectId(String(id))) },
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = Array.from(
      new Set(negs.map((n: any) => String(n.productId)).filter(Boolean))
    );
    const userIds = Array.from(
      new Set(
        negs
          .flatMap((n: any) => [String(n.buyerId), String(n.sellerId)])
          .filter(Boolean)
      )
    );

    const [products, users] = await Promise.all([
      productIds.length
        ? ProductModel.find({ _id: { $in: productIds } })
            .select("productName productMedia")
            .lean()
        : Promise.resolve([]),
      userIds.length
        ? UserModel.find({ _id: { $in: userIds } })
            .select("_id userName userAvatar")
            .lean()
        : Promise.resolve([]),
    ]);

    const prodMap: Record<string, any> = {};
    for (const p of products) prodMap[String(p._id)] = p;
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[String(u._id)] = u;

    // map negotiation -> include associated order id/status
    const orderMapByNegotiation: Record<string, any> = {};
    for (const o of orders) {
      const ref = String(o.orderPaymentReference || "").trim();
      if (!ref) continue;
      const id = ref.startsWith("NEGOTIATION-")
        ? ref.replace("NEGOTIATION-", "")
        : /^[a-fA-F0-9]{24}$/.test(ref)
        ? ref
        : null;
      if (id) orderMapByNegotiation[id] = o;
    }

    const items = await Promise.all(
      negs.map(async (n: any) => {
        // prefer stored attemptNumber if available
        let attemptNumber: number;
        if (typeof n.attemptNumber === "number") {
          attemptNumber = Number(n.attemptNumber);
        } else {
          const attempt = await NegotiationModel.countDocuments({
            productId: n.productId,
            buyerId: n.buyerId,
            createdAt: { $lt: n.createdAt },
          });
          attemptNumber = Number(attempt) + 1;
        }

        const orderForThis = orderMapByNegotiation[String(n._id)];

        return {
          id: String(n._id),
          productId: n.productId ? String(n.productId) : undefined,
          productName: n.productId
            ? prodMap[String(n.productId)]?.productName
            : undefined,
          productImage:
            n.productId &&
            prodMap[String(n.productId)] &&
            Array.isArray(prodMap[String(n.productId)].productMedia)
              ? prodMap[String(n.productId)].productMedia[0]
              : undefined,
          offeredPrice: n.offeredPrice,
          quantity: typeof n.quantity === "number" ? n.quantity : undefined,
          status: n.status,
          createdAt: n.createdAt
            ? new Date(n.createdAt).toISOString()
            : undefined,
          acceptedAt: n.acceptedAt
            ? new Date(n.acceptedAt).toISOString()
            : undefined,
          rejectedAt: n.rejectedAt
            ? new Date(n.rejectedAt).toISOString()
            : undefined,
          attemptNumber,
          isBuyer: String(n.buyerId) === String(userId),
          currentUser: {
            id: String(user.sub),
            name: (user as any).userName || undefined,
            avatar: (user as any).userAvatar || undefined,
          },
          counterpart:
            String(n.buyerId) === String(userId)
              ? userMap[String(n.sellerId)]
                ? {
                    id: String(n.sellerId),
                    name: userMap[String(n.sellerId)].userName,
                    avatar: userMap[String(n.sellerId)].userAvatar,
                  }
                : { id: String(n.sellerId) }
              : userMap[String(n.buyerId)]
              ? {
                  id: String(n.buyerId),
                  name: userMap[String(n.buyerId)].userName,
                  avatar: userMap[String(n.buyerId)].userAvatar,
                }
              : { id: String(n.buyerId) },
          order: orderForThis
            ? { id: String(orderForThis._id), status: orderForThis.orderStatus }
            : undefined,
        };
      })
    );

    return sendSuccess(res, { page, pageSize, total: totalOrders, items });
  } catch (err: any) {
    console.error("listReceivedNegotiations error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
