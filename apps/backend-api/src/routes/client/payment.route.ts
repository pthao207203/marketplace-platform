import { Router } from "express";
import * as controller from "../../controllers/client/payment.controller";
import { requireClientAuth } from "../../middlewares/auth.middleware"; 

const router = Router();


// API TẠO GIAO DỊCH 
router.post("/create-url/zalopay", requireClientAuth, controller.createZaloPayPayment);

// "Thanh toán MoMo" 
//router.post("/create-url/momo", requireAuth, controller.createMoMoUrl);

// API CALLBACK 
// ZaloPay gọi về báo kết quả
router.post("/callback/zalopay", controller.callbackZaloPay);

// MoMo gọi về báo kết quả
//router.post("/callback/momo", controller.callbackMoMo);

export default router;
