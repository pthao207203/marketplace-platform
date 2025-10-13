// src/routes/admin/order.route.ts
import { Router } from 'express';
import { listOrders } from '../../controllers/admin/order.controller';

const router = Router();

router.get('/', listOrders);

export default router;
