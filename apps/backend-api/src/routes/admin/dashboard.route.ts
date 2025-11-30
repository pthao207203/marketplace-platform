import { Router, type Request, type Response } from "express";
import {
  index,
  stats,
  getMetrics,
} from "../../controllers/admin/dashboard.controller";

const router = Router();

// GET /admin/dashboard/
router.get("/", index);

// GET /admin/dashboard/stats
router.get("/stats", stats);

// GET /admin/dashboard/metrics
router.get("/metrics", getMetrics);

export default router;
