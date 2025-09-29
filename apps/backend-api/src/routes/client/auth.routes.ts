import { Router } from 'express';
import { loginClient, precheckPhone, register } from '../../controllers/client/auth.controller';

const router = Router();

router.post('/login', loginClient);

router.post('/precheck', precheckPhone);

router.post('/register', register);

export default router;
