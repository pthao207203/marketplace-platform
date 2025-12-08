import { Router, type Request, type Response } from "express";
import {
  index,
  stats,
  getMetrics,
  getOrderStats,
  getUserStats,
  getMonthlySales,
} from "../../controllers/admin/dashboard.controller";

const router = Router();

// GET /admin/dashboard/
router.get("/", index);

// GET /admin/dashboard/stats
router.get("/stats", stats);

// GET /admin/dashboard/metrics
router.get("/metrics", getMetrics);

// GET /admin/dashboard/orders-stats
router.get("/orders-stats", getOrderStats);

// GET /admin/dashboard/users-stats
router.get("/users-stats", getUserStats);

// GET /admin/dashboard/monthly-sales
router.get("/monthly-sales", getMonthlySales);

export default router;
