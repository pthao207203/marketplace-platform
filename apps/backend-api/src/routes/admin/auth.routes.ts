import { Router } from 'express';
import { loginShopAdmin } from '../../controllers/admin/auth.controller';

const router = Router();

router.post('/login', loginShopAdmin);

export default router;
