import { Router } from "express";
import { getProducts, postProduct } from "../../controllers/admin/product.controller";

const router = Router();

// Admin product list and create
router.get("/", getProducts);
router.post("/", postProduct);

export default router;
