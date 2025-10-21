import { Router } from "express";
import { requireClientAuth } from "../../middlewares/auth";
import { addToCart, viewCart } from "../../controllers/client/cart.controller";

const router = Router();
// POST /api/me/cart  -> add item to cart
router.post('/cart', requireClientAuth, addToCart);

// GET /api/me/cart -> view cart
router.get('/cart', requireClientAuth, viewCart);

export default router;
