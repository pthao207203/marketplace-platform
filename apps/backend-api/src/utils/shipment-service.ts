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

// upsertFromProvider: nhận dữ liệu tracking (tmLike) từ nhà cung cấp
// và cập nhật document Shipment tương ứng (theo shipmentId).
// - tmLike: object có thể chứa các trường như `tracking_number`, `courier_code`,
//   `status`, `checkpoints`... (kiểu tương tự TrackingMore API)
// - Hàm đảm bảo chỉ "promote" (nâng cấp) trạng thái shipment khi logic cho phép,
//   và ghi nhận các sự kiện (checkpoints) vào array `events` của shipment.
export async function upsertFromProvider(shipmentId: string, tmLike: any) {
  console.log("upsertFromProvider called", { shipmentId, tmLike });
  // Helper: cố gắng thực hiện hoàn tiền cho đơn hàng liên quan (idempotent)
  // - Nếu đơn có `returnRequest.status === 'approved'` và chưa `refundProcessed`,
  //   hàm này sẽ cộng tiền vào ví người mua và đánh dấu refundProcessed.
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
          // record originating order id so received-history and audits can link the refund
          orderId: String(order._id),
          meta: { orderId: String(order._id) },
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
        // Cập nhật order để ghi nhận refund đã được xử lý
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

  // mapStatusToUnified: chuyển status chuỗi từ provider sang numeric unified enum
  const status = mapStatusToUnified(tmLike.status);
  // load shipment hiện tại từ DB để quyết định có nên promote trạng thái hay không
  const sh: any = await ShipmentModel.findById(shipmentId as any);

  // Nếu shipment đã ở trạng thái RETURNED và order đã được xử lý refund,
  // bỏ qua các cập nhật tiếp theo (idempotent protection)
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

  // Nếu provider trả về tracking_number / courier_code và shipment hiện chưa có,
  // lưu lại chúng vào object `updates` để upsert sau.
  const updates: any = {};
  if (tmLike.tracking_number && (!sh || !sh.trackingNumber))
    updates.trackingNumber = tmLike.tracking_number;
  if (tmLike.courier_code && (!sh || !sh.courierCode))
    updates.courierCode = tmLike.courier_code;

  // Quy tắc promote: chỉ nâng cấp currentStatus khi rank của trạng thái mới lớn hơn
  // rank của trạng thái hiện tại (RANK: định nghĩa thứ tự ưu tiên trạng thái)
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
    // Nếu nên promote, set currentStatus, rawStatus và lastSyncedAt
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
    // Nếu không promote nhưng có tracking/courier mới, chỉ set các trường đó
    updates.lastSyncedAt = new Date();
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: updates });
  } else {
    // Không có gì thay đổi nhiều, cập nhật cờ lastSyncedAt để biết đã sync
    await ShipmentModel.updateOne(
      { _id: shipmentId },
      { $set: { lastSyncedAt: new Date() } }
    );
  }

  // Nếu trạng thái hiện tại hoặc sự kiện báo RETURNED nhưng không promote (điều kiện promote false),
  // vẫn cố gắng thực hiện attemptRefund để đảm bảo refund được xử lý.
  if (status === SHIPMENT_STATUS.RETURNED && !shouldPromote) {
    try {
      await attemptRefund(shipmentId);
    } catch (e) {
      console.error("attemptRefund after upsert (no-promo) failed", e);
    }
  }

  // Xử lý từng checkpoint/event được cung cấp trong tmLike.checkpoints
  // - chuẩn hóa thời gian, mô tả, vị trí
  // - tính hash để tránh duplicate
  // - push vào mảng `events` nếu chưa tồn tại
  // for (const c of tmLike.checkpoints || []) {
  //   const time = c.time ? new Date(c.time) : new Date();
  //   const desc = c.description || c.desc || "";

  //   // Chuẩn hóa trường location về object có cấu trúc giống Schema LocationSchema
  //   let locObj: any = null;
  //   if (c.location) {
  //     if (typeof c.location === "object") {
  //       locObj = {
  //         address: c.location.address || c.location.name || "",
  //         city: c.location.city || c.location.town || "",
  //         province: c.location.province || c.location.state || "",
  //         country: c.location.country || "",
  //         postalCode: c.location.postalCode || c.location.postal_code || "",
  //         lat: c.location.lat ?? c.location.latitude ?? null,
  //         lng: c.location.lng ?? c.location.longitude ?? null,
  //       };
  //     } else if (typeof c.location === "string") {
  //       // Try to parse "lat,lng|address" or simple "lat,lng" or fallback to address string
  //       const parts = c.location.split("|").map((p: string) => p.trim());
  //       const coords = parts[0].split(",").map((p: string) => p.trim());
  //       if (
  //         coords.length === 2 &&
  //         !isNaN(Number(coords[0])) &&
  //         !isNaN(Number(coords[1]))
  //       ) {
  //         locObj = {
  //           lat: Number(coords[0]),
  //           lng: Number(coords[1]),
  //           address: parts[1] ?? "",
  //         };
  //       } else {
  //         locObj = { address: c.location };
  //       }
  //     }
  //   }

  //   // map code từ mô tả -> eventCode numeric và suy ra derivedStatus nếu có
  //   const code = mapDescToEventCode(desc);
  //   const derivedStatus = eventCodeToStatusValue(code);
  //   // Tạo hash từ shipmentId + time + desc + location để tránh ghi duplicate event
  //   const hashInput = JSON.stringify({
  //     shipmentId,
  //     time: time.toISOString(),
  //     desc,
  //     loc: locObj ?? c.location,
  //   });
  //   const hash = crypto.createHash("sha1").update(hashInput).digest("hex");

  //   // Lấy events hiện tại để kiểm tra duplicate bằng hash
  //   const shDoc: any = await ShipmentModel.findById(shipmentId as any)
  //     .select("events")
  //     .lean();
  //   const already = (shDoc?.events || []).find((e: any) => e.hash === hash);
  //   if (!already) {
  //     // Push event mới vào array events
  //     await ShipmentModel.updateOne(
  //       { _id: shipmentId },
  //       {
  //         $push: {
  //           events: {
  //             shipmentId,
  //             eventCode: code,
  //             description: desc,
  //             location: locObj,
  //             eventTime: time,
  //             raw: c,
  //             hash,
  //           },
  //         },
  //       }
  //     );
  //     // If this event indicates a promotion in shipment status (e.g., RETURN_INITIATED/RETURNED), update shipment currentStatus
  //     try {
  //       if (derivedStatus && derivedStatus !== SHIPMENT_STATUS.UNKNOWN) {
  //         const current =
  //           sh && typeof sh.currentStatus === "number"
  //             ? sh.currentStatus
  //             : undefined;
  //         const derivedName = statusValueToName(derivedStatus);
  //         const currentName =
  //           current != null ? statusValueToName(current) : "CREATED";
  //         const promote =
  //           ((RANK as any)[derivedName] ?? 0) >
  //           ((RANK as any)[currentName] ?? 0);
  //         if (promote) {
  //           // Nếu derived status có rank cao hơn, cập nhật currentStatus
  //           await ShipmentModel.updateOne(
  //             { _id: shipmentId },
  //             {
  //               $set: {
  //                 currentStatus: derivedStatus,
  //                 lastSyncedAt: new Date(),
  //               },
  //             }
  //           );
  //           // Nếu trạng thái mới là RETURNED thì trigger attemptRefund
  //           if (derivedStatus === SHIPMENT_STATUS.RETURNED) {
  //             try {
  //               await attemptRefund(shipmentId);
  //             } catch (e) {
  //               console.error("process refund (from event) failed", e);
  //             }
  //           }
  //         } else {
  //           // Nếu không promote nhưng derivedStatus là RETURNED vẫn cố gắng attemptRefund
  //           if (derivedStatus === SHIPMENT_STATUS.RETURNED) {
  //             try {
  //               await attemptRefund(shipmentId);
  //             } catch (e) {
  //               console.error("attemptRefund after event (no-promo) failed", e);
  //             }
  //           }
  //         }
  //       }
  //     } catch (e) {
  //       console.error("error while promoting status from event", e);
  //     }
  //   }
  // }
}

export default { upsertFromProvider };
