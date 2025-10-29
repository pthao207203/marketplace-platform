import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import OrderModel from "../../models/order.model";
import ShipmentModel from "../../models/shipment.model";
import { startSimulation } from "../../services/shipment.simulator.service";
import { Types } from "mongoose";
import axios from "axios";
import { upsertFromProvider } from "../../utils/shipment-service";
import { ORDER_STATUS } from "../../constants/order.constants";
import { SHIPMENT_STATUS } from "../../constants/order.constants";
import { USER_ROLE, USER_ROLE_CODE } from "../../constants/user.constants";

export async function confirmOrderHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");

    // check that the caller is one of the orderSellerIds
    const sellerId = String(user.sub);
    const isSeller = (order.orderSellerIds || []).some((id: any) => {
      // If id is a Mongo ObjectId, use toHexString() when available, otherwise fallback to String()
      const idHex =
        id && typeof id.toHexString === "function"
          ? id.toHexString()
          : String(id);
      return idHex === sellerId || String(id) === sellerId;
    });
    if (!isSeller) return sendError(res, 403, "Forbidden");

    // lock order and mark as SHIPPING
    await OrderModel.updateOne(
      { _id: orderId },
      { $set: { orderStatus: ORDER_STATUS.SHIPPING, orderLocked: true } }
    );

    // create shipment record
    const courierName =
      process.env.TRACKING_PROVIDER === "trackingmore"
        ? "TRACKINGMORE"
        : "SIMULATOR";
    const shipment = await ShipmentModel.create({
      courierCode: courierName,
      currentStatus: 1,
      rawStatus: "LABEL_CREATED",
      events: [],
      orderId: orderId,
    });

    // If an external tracking service is configured, ask it to create a tracking number
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
            carrier: shipment.carrier,
            callbackUrl,
          }
        );

        const body = resp.data || {};
        if (body.trackingNumber) {
          shipment.trackingNumber = body.trackingNumber;
          shipment.courierCode = body.courierCode || shipment.carrier;
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
      } else {
        // Fallback: no external service configured — keep existing local behaviour
        // startSimulation below will handle simulation for local provider
      }
    } catch (err: any) {
      console.error("call to tracking service failed", err?.message || err);
    }

    // start local simulation only when not using the real provider
    if (process.env.TRACKING_PROVIDER !== "trackingmore") {
      startSimulation(String(shipment._id));
    }

    return sendSuccess(res, { shipment, orderId }, 201);
  } catch (err: any) {
    console.error("confirmOrder error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /admin/orders/returns/pending -> list orders with pending returnRequest
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

// POST /admin/orders/:id/return/review -> { action: 'approve'|'reject', rejectionReason?: string }
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
    if (!order) return sendError(res, 404, "Order not found");
    if (!order.returnRequest)
      return sendError(res, 400, "No return request found");
    if (order.returnRequest.status !== "pending")
      return sendError(res, 400, "Return request not pending");

    if (action === "approve") {
      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            "returnRequest.status": "approved",
            "returnRequest.reviewedAt": new Date(),
            "returnRequest.reviewerId": user.sub,
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

// GET /admin/orders/:id -> order detail (admin sees all, shop only their orders)
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId))
      return sendError(res, 400, "Invalid order id");

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, "Order not found");

    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    // resolve role (support userRole or role)
    const rawRole =
      typeof user.userRole !== "undefined" ? user.userRole : user.role;
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

export default { confirmOrderHandler };
