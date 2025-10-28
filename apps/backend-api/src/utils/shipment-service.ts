import crypto from "crypto";
import ShipmentModel from "../models/shipment.model";
import { mapStatusToUnified, mapDescToEventCode, RANK } from "./mapper";
import {
  statusValueToName,
  eventCodeToStatusValue,
} from "../constants/order.constants";
import OrderModel from "../models/order.model";
import { UserModel } from "../models/user.model";
import {
  SHIPMENT_STATUS,
  SHIPMENT_EVENT_CODE,
} from "../constants/order.constants";

export async function upsertFromProvider(shipmentId: string, tmLike: any) {
  // helper: attempt refund processing for a shipment (idempotent)
  async function attemptRefund(shId: string) {
    try {
      const shipmentDoc: any = await ShipmentModel.findById(shId).lean();
      if (!shipmentDoc || !shipmentDoc.orderId) return;
      const order: any = await OrderModel.findById(shipmentDoc.orderId).exec();
      if (!order) return;
      if (
        order.returnRequest &&
        order.returnRequest.status === "approved" &&
        !order.returnRequest.refundProcessed
      ) {
        const buyerId = String(order.orderBuyerId);
        const refundAmount = Number(order.orderTotalAmount || 0);
        const topup = {
          amount: refundAmount,
          currency: "VND",
          bank: { bankName: "REFUND" },
          transactionId: `REFUND-${order._id}-${Date.now()}`,
          status: "completed",
          createdAt: new Date(),
        } as any;
        await UserModel.updateOne(
          { _id: buyerId },
          {
            $inc: { "userWallet.balance": refundAmount },
            $push: { "userWallet.topups": topup },
            $set: { "userWallet.updatedAt": new Date() },
          }
        );
        await OrderModel.updateOne(
          { _id: order._id, "returnRequest.refundProcessed": { $ne: true } },
          {
            $set: {
              "returnRequest.refundProcessed": true,
              "returnRequest.refundAmount": refundAmount,
              "returnRequest.status": "completed",
              orderStatus: 4,
              orderPaymentStatus: "refunded",
            },
          }
        );
      }
    } catch (e) {
      console.error("attemptRefund error", e);
    }
  }

  const status = mapStatusToUnified(tmLike.status);
  const sh: any = await ShipmentModel.findById(shipmentId as any);

  // If shipment is already RETURNED and the related order refund has been processed, skip further processing
  try {
    if (
      sh &&
      typeof sh.currentStatus === "number" &&
      sh.currentStatus === SHIPMENT_STATUS.RETURNED
    ) {
      if (sh.orderId) {
        const ordCheck: any = await OrderModel.findById(sh.orderId)
          .select("returnRequest")
          .lean();
        if (
          ordCheck &&
          ordCheck.returnRequest &&
          ordCheck.returnRequest.refundProcessed
        ) {
          console.info(
            "upsertFromProvider: shipment already RETURNED and refundProcessed - skipping",
            { shipmentId }
          );
          return;
        }
      }
    }
  } catch (e) {
    console.error("error while checking existing refundProcessed state", e);
  }

  // If provider supplied tracking/courier and shipment doesn't have them, persist them
  const updates: any = {};
  if (tmLike.tracking_number && (!sh || !sh.trackingNumber))
    updates.trackingNumber = tmLike.tracking_number;
  if (tmLike.courier_code && (!sh || !sh.courierCode))
    updates.courierCode = tmLike.courier_code;

  // Determine promotion using RANK lookup by status name (RANK keys are names)
  const statusName = statusValueToName(status);
  const currentStatusName =
    sh && typeof sh.currentStatus === "number"
      ? statusValueToName(sh.currentStatus)
      : "CREATED";
  const shouldPromote =
    !sh ||
    ((RANK as any)[statusName] ?? 0) > ((RANK as any)[currentStatusName] ?? 0);
  console.log("upsertFromProvider", {
    shipmentId,
    status,
    statusName,
    currentStatusName,
    shouldPromote,
  });
  if (shouldPromote) {
    updates.currentStatus = status;
    updates.rawStatus = tmLike.status;
    updates.lastSyncedAt = new Date();
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: updates });

    if (status === SHIPMENT_STATUS.RETURNED) {
      try {
        await attemptRefund(shipmentId);
      } catch (e) {
        console.error("process refund on returned shipment failed", e);
      }
    }
  } else if (Object.keys(updates).length) {
    // Only tracking/courier to set
    updates.lastSyncedAt = new Date();
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: updates });
  } else {
    await ShipmentModel.updateOne(
      { _id: shipmentId },
      { $set: { lastSyncedAt: new Date() } }
    );
  }

  // If shipment already at RETURNED and we didn't promote (shouldPromote === false), still attempt refund
  if (status === SHIPMENT_STATUS.RETURNED && !shouldPromote) {
    try {
      await attemptRefund(shipmentId);
    } catch (e) {
      console.error("attemptRefund after upsert (no-promo) failed", e);
    }
  }

  // Process checkpoints/events
  for (const c of tmLike.checkpoints || []) {
    const time = c.time ? new Date(c.time) : new Date();
    const desc = c.description || c.desc || "";

    // Normalize location into the shape used by Shipment model
    let locObj: any = null;
    if (c.location) {
      if (typeof c.location === "object") {
        locObj = {
          address: c.location.address || c.location.name || "",
          city: c.location.city || c.location.town || "",
          province: c.location.province || c.location.state || "",
          country: c.location.country || "",
          postalCode: c.location.postalCode || c.location.postal_code || "",
          lat: c.location.lat ?? c.location.latitude ?? null,
          lng: c.location.lng ?? c.location.longitude ?? null,
        };
      } else if (typeof c.location === "string") {
        // Try to parse "lat,lng|address" or simple "lat,lng" or fallback to address string
        const parts = c.location.split("|").map((p: string) => p.trim());
        const coords = parts[0].split(",").map((p: string) => p.trim());
        if (
          coords.length === 2 &&
          !isNaN(Number(coords[0])) &&
          !isNaN(Number(coords[1]))
        ) {
          locObj = {
            lat: Number(coords[0]),
            lng: Number(coords[1]),
            address: parts[1] ?? "",
          };
        } else {
          locObj = { address: c.location };
        }
      }
    }

    const code = mapDescToEventCode(desc);
    // derive a shipment status from the event code (if any)
    const derivedStatus = eventCodeToStatusValue(code);
    const hashInput = JSON.stringify({
      shipmentId,
      time: time.toISOString(),
      desc,
      loc: locObj ?? c.location,
    });
    const hash = crypto.createHash("sha1").update(hashInput).digest("hex");

    // Use embedded events array on the shipment document to keep model simple
    const shDoc: any = await ShipmentModel.findById(shipmentId as any)
      .select("events")
      .lean();
    const already = (shDoc?.events || []).find((e: any) => e.hash === hash);
    if (!already) {
      await ShipmentModel.updateOne(
        { _id: shipmentId },
        {
          $push: {
            events: {
              shipmentId,
              eventCode: code,
              description: desc,
              location: locObj,
              eventTime: time,
              raw: c,
              hash,
            },
          },
        }
      );
      // If this event indicates a promotion in shipment status (e.g., RETURN_INITIATED/RETURNED), update shipment currentStatus
      try {
        if (derivedStatus && derivedStatus !== SHIPMENT_STATUS.UNKNOWN) {
          const current =
            sh && typeof sh.currentStatus === "number"
              ? sh.currentStatus
              : undefined;
          const derivedName = statusValueToName(derivedStatus);
          const currentName =
            current != null ? statusValueToName(current) : "CREATED";
          const promote =
            ((RANK as any)[derivedName] ?? 0) >
            ((RANK as any)[currentName] ?? 0);
          if (promote) {
            await ShipmentModel.updateOne(
              { _id: shipmentId },
              {
                $set: {
                  currentStatus: derivedStatus,
                  lastSyncedAt: new Date(),
                },
              }
            );
            // if the derived status is RETURNED, attempt refund processing
            if (derivedStatus === SHIPMENT_STATUS.RETURNED) {
              try {
                await attemptRefund(shipmentId);
              } catch (e) {
                console.error("process refund (from event) failed", e);
              }
            }
          } else {
            if (derivedStatus === SHIPMENT_STATUS.RETURNED) {
              try {
                await attemptRefund(shipmentId);
              } catch (e) {
                console.error("attemptRefund after event (no-promo) failed", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("error while promoting status from event", e);
      }
    }
  }
}

export default { upsertFromProvider };
