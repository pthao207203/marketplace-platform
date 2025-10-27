import { Router } from 'express';
import { confirmOrderHandler, listReturnRequests, reviewReturnRequest } from '../../controllers/admin/order.controller';
import { requireClientAuth, requireAdminAuth } from '../../middlewares/auth';

const router = Router();

// Shop confirms an order and shipment is created & simulated
router.post('/:id/confirm', confirmOrderHandler);

// Admin: list pending return requests
router.get('/returns/pending', listReturnRequests);

// Admin: review a return request (approve/reject)
router.post('/:id/return/review', reviewReturnRequest);

export default router;
