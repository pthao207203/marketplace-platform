// apps/backend-api/src/routes/admin/order.route.ts
import { Router } from 'express';
import { listOrders } from '../../controllers/admin/order.controller';

const router = Router();

// GET /api/admin/orders
router.get('/', listOrders);

// TODO: Thêm các route khác sau
// GET /api/admin/orders/:id
// POST /api/admin/orders
// PUT /api/admin/orders/:id
// DELETE /api/admin/orders/:id

export default router;
