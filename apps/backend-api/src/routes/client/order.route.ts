import { Router } from 'express';
import { previewOrder, placeOrder } from '../../controllers/client/order.controller';
import { requireClientAuth } from '../../middlewares/auth';

const router = Router();

// Preview order before placing: accepts { items: [{ productId, qty }] }
router.post('/preview', requireClientAuth, previewOrder);

// Place an order: accepts items, paymentMethod, shippingAddressId or shippingAddress object
router.post('/place', requireClientAuth, placeOrder);

export default router;

