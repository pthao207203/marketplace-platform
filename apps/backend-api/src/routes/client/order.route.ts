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
  updateOrderShipping,
} from "../../controllers/client/order.controller";
import { requireClientAuth } from "../../middlewares/auth.middleware";

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

// Update shipping address for an order (buyer)
// Resolve handler at runtime to avoid potential circular import timing issues
router.patch("/:id/shipping", requireClientAuth, (req, res, next) => {
  // require here so the function is looked up when route is invoked
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ctrl = require("../../controllers/client/order.controller");
  return ctrl.updateOrderShipping(req, res, next);
});

// List orders (filter by status) and get order detail
router.get("/", requireClientAuth, listOrders);
router.get("/:id", requireClientAuth, getOrderDetail);
// removed by-ref route: not required per current requirements

export default router;
