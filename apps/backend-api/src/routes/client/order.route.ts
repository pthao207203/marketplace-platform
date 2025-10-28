import { Router } from 'express';
import { previewOrder, placeOrder, rateShop, confirmDelivery, submitReturnRequest } from '../../controllers/client/order.controller';
import { requireClientAuth } from '../../middlewares/auth';

const router = Router();

// Preview order before placing: accepts { items: [{ productId, qty }] }
router.post('/preview', requireClientAuth, previewOrder);

// Place an order: accepts items, paymentMethod, shippingAddressId or shippingAddress object
router.post('/place', requireClientAuth, placeOrder);

// Confirm delivery (buyer confirms they received the shipment)
router.post('/:id/confirm-delivery', requireClientAuth, confirmDelivery);

// Buyer rates shop after confirming delivery
router.post('/:id/rate', requireClientAuth, rateShop);

// Buyer submits a return/refund request with video evidence
router.post('/:id/return', requireClientAuth, submitReturnRequest);

export default router;

