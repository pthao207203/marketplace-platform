import { Router } from 'express';
import { loginClient } from '../../controllers/client/auth.controller';

const router = Router();

router.post('/login', loginClient);

export default router;
