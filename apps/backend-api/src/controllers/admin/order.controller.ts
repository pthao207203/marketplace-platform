import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import OrderModel from "../../models/order.model";
import ShipmentModel from "../../models/shipment.model";
import { startSimulation } from "../../services/shipment.simulator.service";
import { Types } from "mongoose";
import axios from "axios";
import { upsertFromProvider } from "../../utils/shipment-service";
import { ORDER_STATUS } from "../../constants/order.constants";
import { USER_ROLE, USER_ROLE_CODE } from "../../constants/user.constants";
import { parsePaging } from "../../utils/pagination";

// ⚠️ THÊM MỚI: GET /api/admin/orders - LIST ORDERS
export async function listOrders(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { page, pageSize, skip, limit } = parsePaging(req.query);
    const q: any = req.query || {};

    // Build filter
    const filter: any = {};

    // 1. Search by orderId or userId
    if (q.search) {
      filter.$or = [
        { orderId: { $regex: String(q.search), $options: "i" } },
        { orderBuyerId: { $regex: String(q.search), $options: "i" } },
      ];
    }

    // 2. Filter by status
    if (q.status && q.status !== "All") {
      // Map frontend status to backend ORDER_STATUS
      const statusMap: Record<string, number> = {
        Pending: ORDER_STATUS.PENDING,
        Cancelled: ORDER_STATUS.CANCELLED,
        Delivering: ORDER_STATUS.SHIPPING,
        Delivered: ORDER_STATUS.DELIVERED,
        Returned: ORDER_STATUS.RETURNED,
      };

      const backendStatus = statusMap[q.status];
      if (backendStatus !== undefined) {
        filter.orderStatus = backendStatus;
      }
    }

    // 3. Filter by date range
    if (q.dateFrom || q.dateTo) {
      filter.createdAt = {};
      if (q.dateFrom) {
        const dateStart = new Date(q.dateFrom);
        dateStart.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = dateStart;
      }
      if (q.dateTo) {
        const dateEnd = new Date(q.dateTo);
        dateEnd.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = dateEnd;
      }
    }

    // 4. Filter by price range
    if (q.minAmount || q.maxAmount) {
      filter.orderTotalAmount = {};
      if (q.minAmount) filter.orderTotalAmount.$gte = Number(q.minAmount);
      if (q.maxAmount) filter.orderTotalAmount.$lte = Number(q.maxAmount);
    }

    // Role-based filter
    const rawRole =
      typeof user.userRole !== "undefined" ? user.userRole : user.role;
    const roleCode = resolveRoleCode(rawRole);

    if (roleCode === USER_ROLE.SHOP) {
      // Shop chỉ xem orders của mình
      const shopId = String(user.sub);
      filter.orderSellerIds = shopId;
    }
    // Admin xem tất cả

    // Execute query
    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    // Map to frontend format
    const mapped = items.map((order: any) => {
      // Map backend status to frontend status
      const statusMap: Record<number, string> = {
        [ORDER_STATUS.PENDING]: "Pending",
        [ORDER_STATUS.SHIPPING]: "Delivering",
        [ORDER_STATUS.DELIVERED]: "Delivered",
        [ORDER_STATUS.CANCELLED]: "Cancelled",
        [ORDER_STATUS.RETURNED]: "Returned",
      };

      return {
        id: String(order._id),
        orderId: order.orderId || `ORD-${String(order._id).slice(-8)}`,
        userId: String(order.orderBuyerId || ""),
        creationDate: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : "",
        completionDate: order.deliveredAt
          ? new Date(order.deliveredAt).toISOString()
          : undefined,
        status: statusMap[order.orderStatus] || "Pending",
        totalPrice: order.orderTotalAmount || 0,
        totalItems: order.orderItems?.length || 0,
        paymentStatus: order.orderPaymentStatus === "paid" ? "Paid" : "Unpaid",
        canConfirm:
          order.orderStatus === ORDER_STATUS.PENDING && !order.orderLocked,
      };
    });

    return sendSuccess(res, { items: mapped, page, pageSize, total });
  } catch (err: any) {
    console.error("listOrders error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/admin/orders/:id/confirm
export async function confirmOrderHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");

    // Check quyền Shop
    const sellerId = String(user.sub);
    const isSeller = (order.orderSellerIds || []).some((id: any) => {
      const idHex =
        id && typeof id.toHexString === "function"
          ? id.toHexString()
          : String(id);
      return idHex === sellerId || String(id) === sellerId;
    });

    // Cho phép Admin xác nhận giùm shop
    const rawRole =
      typeof user.userRole !== "undefined" ? user.userRole : user.role;
    const roleCode = resolveRoleCode(rawRole);

    if (!isSeller && roleCode !== USER_ROLE.ADMIN) {
      return sendError(res, 403, "Forbidden");
    }

    // Cập nhật trạng thái đơn hàng sang SHIPPING
    await OrderModel.updateOne(
      { _id: orderId },
      {
        $set: {
          orderLocked: true,
          orderStatus: ORDER_STATUS.SHIPPING,
        },
      }
    );

    // Create shipment record
    const courierName =
      process.env.TRACKING_PROVIDER === "trackingmore"
        ? "TRACKINGMORE"
        : "SIMULATOR";

    const shipment = await ShipmentModel.create({
      courierCode: courierName,
      trackingNumber: null,
      currentStatus: 1,
      rawStatus: "LABEL_CREATED",
      events: [],
      orderId: orderId,
    });

    // External Tracking Logic
    try {
      const trackingServiceUrl = process.env.TRACKING_SERVICE_URL;
      if (trackingServiceUrl) {
        const callbackUrl = `${
          process.env.MAIN_APP_URL || "http://localhost:3000"
        }/trackingmore`;

        const resp = await axios.post(
          `${trackingServiceUrl.replace(/\/$/, "")}/create`,
          {
            orderId,
            carrier: courierName,
            callbackUrl,
          }
        );

        const body = resp.data || {};
        if (body.trackingNumber) {
          shipment.trackingNumber = body.trackingNumber;
          shipment.courierCode = body.courierCode || courierName;

          console.log("confirmOrder: received tracking number", {
            trackingNumber: shipment.trackingNumber,
            courierCode: shipment.courierCode,
          });
          await shipment.save();

          if (body.trackingData) {
            try {
              await upsertFromProvider(String(shipment._id), body.trackingData);
            } catch (e) {
              console.error("upsertFromProvider error", e);
            }
          }
        } else {
          console.warn("tracking service did not return trackingNumber", body);
        }
      }
    } catch (err: any) {
      console.error("call to tracking service failed", err?.message || err);
    }

    if (process.env.TRACKING_PROVIDER !== "trackingmore") {
      startSimulation(String(shipment._id));
    }

    return sendSuccess(res, { shipment, orderId }, 201);
  } catch (err: any) {
    console.error("confirmOrder error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// ⚠️ THÊM MỚI: POST /api/admin/orders/:id/cancel
export async function cancelOrderHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");

    // Chỉ cho phép cancel order Pending
    if (order.orderStatus !== ORDER_STATUS.PENDING) {
      return sendError(res, 400, "Can only cancel pending orders");
    }

    const reason = String(req.body?.reason || "Admin cancelled");

    await OrderModel.updateOne(
      { _id: orderId },
      {
        $set: {
          orderStatus: ORDER_STATUS.CANCELLED,
          orderCancelReason: reason,
          orderCancelledAt: new Date(),
          orderCancelledBy: user.sub,
        },
      }
    );

    return sendSuccess(res, { ok: true, message: "Order cancelled" });
  } catch (err: any) {
    console.error("cancelOrder error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /admin/orders/returns/pending
export async function listReturnRequests(req: Request, res: Response) {
  try {
    const docs = await OrderModel.find({ "returnRequest.status": "pending" })
      .lean()
      .limit(200);
    return sendSuccess(res, { requests: docs });
  } catch (err: any) {
    console.error("listReturnRequests error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /admin/orders/:id/return/review
export async function reviewReturnRequest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const body = req.body || {};
    const action = String(body.action || "").toLowerCase();

    if (!["approve", "reject"].includes(action))
      return sendError(res, 400, "Invalid action");

    const order: any = await OrderModel.findById(orderId).lean();
    if (
      !order ||
      !order.returnRequest ||
      order.returnRequest.status !== "pending"
    ) {
      return sendError(res, 400, "Invalid return request state");
    }

    if (action === "approve") {
      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            "returnRequest.status": "approved",
            "returnRequest.reviewedAt": new Date(),
            "returnRequest.reviewerId": user.sub,
            orderStatus: ORDER_STATUS.RETURNED,
          },
        }
      );
      return sendSuccess(res, { ok: true });
    } else {
      const reason = String(body.rejectionReason || "").trim();
      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            "returnRequest.status": "rejected",
            "returnRequest.reviewedAt": new Date(),
            "returnRequest.reviewerId": user.sub,
            "returnRequest.rejectionReason": reason,
          },
        }
      );
      return sendSuccess(res, { ok: true });
    }
  } catch (err: any) {
    console.error("reviewReturnRequest error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/orders/:id
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");

    const user = (req as any).user;
    const userId = String(user.sub);

    // Cho phép Người mua (Buyer) xem đơn của chính mình
    if (String(order.orderBuyerId) === userId) {
      return sendSuccess(res, { order });
    }

    // Logic check role
    const rawRole =
      typeof user.userRole !== "undefined" ? user.userRole : user.role;
    const roleCode = resolveRoleCode(rawRole);

    if (roleCode === USER_ROLE.ADMIN) {
      return sendSuccess(res, { order });
    }

    if (roleCode === USER_ROLE.SHOP) {
      const shopId = String(user.sub);
      const isSeller = (order.orderSellerIds || []).some((id: any) => {
        const idHex =
          id && typeof id.toHexString === "function"
            ? id.toHexString()
            : String(id);
        return idHex === shopId || String(id) === shopId;
      });
      if (!isSeller) return sendError(res, 403, "Forbidden");
      return sendSuccess(res, { order });
    }

    return sendError(res, 403, "Insufficient privileges");
  } catch (err: any) {
    console.error("getOrderDetail error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
// GET /api/shops/:shopId/orders
export async function listShopOrdersByStatusHandler(
  req: Request,
  res: Response
) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const shopIdFromToken = String(user.sub);

    const shopIdFromPath = req.params.shopId;

    const status = req.query.status as string;

    if (shopIdFromPath !== shopIdFromToken) {
      return sendError(res, 403, "Forbidden: Shop ID mismatch");
    }

    const query: any = {};

    query.orderSellerIds = shopIdFromToken;

    if (status) {
      const statusInt = parseInt(status);
      if (!isNaN(statusInt)) {
        query.orderStatus = statusInt;
      } else {
        return sendError(res, 400, "Invalid status parameter");
      }
    }

    const orders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();

    const wrappedOrders = orders.map((order: any) => ({
      id: order._id,
      order: order,
    }));

    return sendSuccess(res, { orders: wrappedOrders });
  } catch (err: any) {
    console.error("listShopOrdersByStatusHandler error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
function resolveRoleCode(role: any): number {
  if (typeof role === "number") return Number(role);
  if (typeof role === "string") {
    const n = Number(role);
    if (!Number.isNaN(n)) return n;
    const key = String(role).toLowerCase();
    // @ts-ignore
    const mapped = USER_ROLE_CODE[key];
    return typeof mapped === "number" ? mapped : NaN;
  }
  return NaN;
}
export default {
  listOrders,
  confirmOrderHandler,
  cancelOrderHandler,
  listReturnRequests,
  reviewReturnRequest,
  getOrderDetail,
  listShopOrdersByStatusHandler,
};
