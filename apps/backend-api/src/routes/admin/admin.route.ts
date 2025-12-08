import { Router } from "express";
import {
  getListAdmins,
  getAdminDetail,
} from "../../controllers/admin/admin.controller";

const router = Router();

// GET /admin/administrators
router.get("/", getListAdmins);
router.get("/:id", getAdminDetail);

export default router;
