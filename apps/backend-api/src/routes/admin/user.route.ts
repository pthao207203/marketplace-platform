import { Router } from 'express';
import { listSellerApplications, reviewSellerApplication } from '../../controllers/admin/user.controller';
import { requireClientAuth } from '../../middlewares/auth.middleware';

const router = Router();

// list pending seller applications
router.get('/sellers/pending', listSellerApplications);

// review a seller application (approve/reject)
router.post('/sellers/:id/review', reviewSellerApplication);

export default router;
