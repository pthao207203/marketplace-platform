import { Router } from 'express';
import { previewOrder, placeOrder, confirmDelivery } from '../../controllers/client/order.controller';
import { requireClientAuth } from '../../middlewares/auth';

const router = Router();

// Preview order before placing: accepts { items: [{ productId, qty }] }
router.post('/preview', requireClientAuth, previewOrder);

// Place an order: accepts items, paymentMethod, shippingAddressId or shippingAddress object
router.post('/place', requireClientAuth, placeOrder);

// Confirm delivery (buyer confirms they received the shipment)
router.post('/:id/confirm-delivery', requireClientAuth, confirmDelivery);

export default router;

