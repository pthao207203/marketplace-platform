import { Router } from "express";
import {
  getListSellers,
  getSellerDetail,
} from "../../controllers/admin/seller.controller";

const router = Router();

// GET /admin/sellers
router.get("/", getListSellers);
router.get("/:id", getSellerDetail);

export default router;
