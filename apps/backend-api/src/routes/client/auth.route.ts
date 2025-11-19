import { Router } from 'express';
import { loginClient, precheckPhone, register, googleSignIn, completeSocialSign } from '../../controllers/client/auth.controller';

const router = Router();

router.post('/login', loginClient);

router.post('/precheck', precheckPhone);

router.post('/register', register);

router.post('/google', googleSignIn);
// legacy / client expectation: accept /login-google as alias
router.post('/login-google', googleSignIn);

router.post('/google/complete', completeSocialSign);

export default router;
