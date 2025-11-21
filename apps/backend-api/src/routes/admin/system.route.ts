import { Router } from 'express';
import { requireClientAuth } from '../../middlewares/auth.middleware';
import { getSystem, putSystem } from '../../controllers/admin/system.controller';

const router = Router();

// GET current system settings (admin/shop only)
router.get('/', requireClientAuth, getSystem);

// PUT update system settings (upsert) — admin/shop only
router.put('/', requireClientAuth, putSystem);

export default router;
