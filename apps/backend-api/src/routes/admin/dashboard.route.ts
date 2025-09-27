import { Router, type Request, type Response } from 'express'
import { index, stats } from '../../controllers/dashboard.controller'

const router = Router()

// GET /admin/dashboard/
router.get('/', index);

// GET /admin/dashboard/stats
router.get('/stats', stats);

export default router
