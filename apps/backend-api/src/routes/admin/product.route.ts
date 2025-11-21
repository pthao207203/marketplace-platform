import { Router } from "express";
import {
  getProducts,
  postProduct,
  getProductDetail,
  respondNegotiationHandler,
  getProductMeta,
} from "../../controllers/admin/product.controller";

const router = Router();

// Admin product list and create
router.get("/", getProducts);
router.get("/meta", getProductMeta);
router.post("/", postProduct);
router.get("/:id", getProductDetail);

// Admin respond to a negotiation (seller/admin action)
router.post("/negotiations/:id/respond", respondNegotiationHandler);

export default router;
