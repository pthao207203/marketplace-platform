import { Router } from "express";
import { requireClientAuth } from "../../middlewares/auth";
import { addToCart, viewCart } from "../../controllers/client/cart.controller";
import { getMyProfile } from "../../controllers/client/user.controller";

const router = Router();
// POST /api/me/cart  -> add item to cart
router.post('/cart', requireClientAuth, addToCart);

// GET /api/me/cart -> view cart
router.get('/cart', requireClientAuth, viewCart);

// GET /api/me/profile -> get current user's profile
router.get('/', requireClientAuth, getMyProfile);

export default router;
