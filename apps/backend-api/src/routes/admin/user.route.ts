import { Router } from "express";
import {
  listSellerApplications,
  reviewSellerApplication,
  updateUserStatus,
} from "../../controllers/admin/user.controller";

const router = Router();

// list pending seller applications
router.get("/sellers/pending", listSellerApplications);

// review a seller application (approve/reject)
router.post("/sellers/:id/review", reviewSellerApplication);

// PATCH /admin/users/:id/status
router.patch("/:id/status", updateUserStatus);

export default router;
