import { Router } from "express";
import {
  listOrders,
  confirmOrderHandler,
  getOrderDetail,
  listReturnRequests,
  reviewReturnRequest,
  listShopOrdersByStatusHandler,
} from "../../controllers/admin/order.controller";

const router = Router();
//router.get("/:shopId/orders", listShopOrdersByStatusHandler);
// Admin/shop order detail
router.get("/:id", getOrderDetail);

// Shop confirms an order and shipment is created & simulated
router.post("/:id/confirm", confirmOrderHandler);

// Admin: list pending return requests
router.get("/returns/pending", listReturnRequests);

// Admin: review a return request (approve/reject)
router.post("/:id/return/review", reviewReturnRequest);

export default router;
