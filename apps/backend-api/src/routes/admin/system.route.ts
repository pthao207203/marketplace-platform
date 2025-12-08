import { Router } from "express";
import {
  getSystemConfig,
  updateSystemConfig,
} from "../../controllers/admin/system.controller";

const router = Router();

// GET /admin/system

router.get("/", getSystemConfig);

// PUT /admin/system
router.put("/", updateSystemConfig);

export default router;
