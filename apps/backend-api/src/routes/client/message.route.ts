import { Router } from "express";
import {
  getConversations,
  getConversationWithUser,
  postMessage,
} from "../../controllers/client/message.controller";
import { requireClientAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/conversations", requireClientAuth, getConversations);
router.get("/with/:userId", requireClientAuth, getConversationWithUser);
router.post("/", requireClientAuth, postMessage);

export default router;
