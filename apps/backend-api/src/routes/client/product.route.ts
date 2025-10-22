import { Router } from "express";
import { getHome } from "../../controllers/client/product.controller";
import { getAuctions, placeBid, getAuctionById } from "../../controllers/client/auction.controller";
import { requireClientAuth } from "../../middlewares/auth";

const router = Router();
router.get("/home", getHome);
router.get("/auctions", getAuctions);
router.get("/auctions/:id", getAuctionById);
router.post("/auctions/:id/bid", requireClientAuth, placeBid);

export default router;
