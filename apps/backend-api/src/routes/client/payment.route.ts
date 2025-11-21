import { Router } from "express";
import * as controller from "../../controllers/client/payment.controller";
import { requireClientAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create-url/zalopay",
  requireClientAuth,
  controller.createZaloPayPayment
);

router.post("/callback/zalopay", controller.callbackZaloPay);

router.get("/result", controller.renderPaymentSuccess);

export default router;
