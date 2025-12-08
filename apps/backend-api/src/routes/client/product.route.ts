import { Router } from "express";
import {
  getHome,
  getProducts,
  listMyNegotiations,
} from "../../controllers/client/product.controller";
import { getProductDetail } from "../../controllers/client/product.controller";
import {
  getAuctions,
  placeBid,
  getAuctionById,
  getParticipatedAuctions,
  getSuccessfulAuctions,
  getFailedAuctions,
} from "../../controllers/client/auction.controller";
import {
  createNegotiationHandler,
  listReceivedNegotiationsHandler,
} from "../../controllers/client/negotiation.controller";
import { requireClientAuth } from "../../middlewares/auth.middleware";

const router = Router();

// Home route
router.get("/home", getHome);
router.get(
  "/auctions/participated",
  requireClientAuth,
  getParticipatedAuctions
);
router.get("/auctions/successful", requireClientAuth, getSuccessfulAuctions);
router.get("/auctions/failed", requireClientAuth, getFailedAuctions);
router.get("/auctions", getAuctions);
router.get("/auctions/:id", getAuctionById);
router.post("/auctions/:id/bid", requireClientAuth, placeBid);

// Negotiations for current user
router.get("/negotiations", requireClientAuth, listMyNegotiations);

// Negotiations that have been received (order delivered)
router.get(
  "/negotiations/received",
  requireClientAuth,
  listReceivedNegotiationsHandler
);

router.post("/negotiate/:id/buy", requireClientAuth, createNegotiationHandler);
router.get("/", getProducts);
router.get("/:id", getProductDetail);

export default router;
