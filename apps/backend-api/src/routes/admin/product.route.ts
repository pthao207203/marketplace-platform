import { Router } from "express";
import {
  getProducts,
  postProduct,
  getProductDetail,
  respondNegotiationHandler,
} from "../../controllers/admin/product.controller";

const router = Router();

// Admin product list and create
router.get("/", getProducts);
router.post("/", postProduct);
router.get("/:id", getProductDetail);

// Admin respond to a negotiation (seller/admin action)
router.post("/negotiations/:id/respond", respondNegotiationHandler);

export default router;
