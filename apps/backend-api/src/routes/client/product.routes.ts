import { Router } from "express";
import { getHome } from "../../controllers/client/product.controller";

const router = Router();
router.get("/home", getHome);

export default router;
