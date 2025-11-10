import { Router } from "express";
import {
  previewOrder,
  placeOrder,
  rateShop,
  confirmDelivery,
  listOrders,
  getOrderDetail,
  submitReturnRequest,
  cancelOrder,
} from "../../controllers/client/order.controller";
import { requireClientAuth } from "../../middlewares/auth";

const router = Router();

// Preview order before placing: accepts { items: [{ productId, qty }] }
router.post("/preview", requireClientAuth, previewOrder);

// Place an order: accepts items, paymentMethod, shippingAddressId or shippingAddress object
router.post("/place", requireClientAuth, placeOrder);

// Confirm delivery (buyer confirms they received the shipment)
router.post("/:id/confirm-delivery", requireClientAuth, confirmDelivery);

// Buyer rates shop after confirming delivery
router.post("/:id/rate", requireClientAuth, rateShop);

// Buyer submits a return/refund request with video evidence
router.post("/:id/return", requireClientAuth, submitReturnRequest);

// Buyer cancels an order (only allowed before shop confirms / when orderLocked is false)
router.post("/:id/cancel", requireClientAuth, cancelOrder);

// List orders (filter by status) and get order detail
router.get("/", requireClientAuth, listOrders);
router.get("/:id", requireClientAuth, getOrderDetail);

export default router;
