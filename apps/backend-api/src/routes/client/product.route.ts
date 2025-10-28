import { Router } from "express";
import { getHome } from "../../controllers/client/product.controller";
import { getProductDetail } from "../../controllers/client/product.controller";
import {
  getAuctions,
  placeBid,
  getAuctionById,
} from "../../controllers/client/auction.controller";
import { createNegotiationHandler } from "../../controllers/client/negotiation.controller";
import { requireClientAuth } from "../../middlewares/auth";

const router = Router();
router.get("/home", getHome);
router.get("/:id", getProductDetail);
router.get("/auctions", getAuctions);
router.get("/auctions/:id", getAuctionById);
router.post("/auctions/:id/bid", requireClientAuth, placeBid);
router.post("/negotiate/:id/buy", requireClientAuth, createNegotiationHandler);

export default router;
