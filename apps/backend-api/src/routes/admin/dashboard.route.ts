import { Router } from 'express';
import { index, stats } from '../../controllers/admin/dashboard.controller';

const router = Router();

// GET /api/admin/dashboard
router.get('/', index);

// GET /api/admin/dashboard/stats
router.get('/stats', stats);

export default router;
