import { Router } from 'express';
import { confirmOrderHandler } from '../../controllers/admin/order.controller';
import { requireClientAuth } from '../../middlewares/auth';

const router = Router();

// Shop confirms an order and shipment is created & simulated
router.post('/:id/confirm', requireClientAuth, confirmOrderHandler);

export default router;
