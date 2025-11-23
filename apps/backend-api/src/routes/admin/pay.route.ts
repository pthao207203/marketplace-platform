import { Router } from "express";
import * as controller from "../../controllers/admin/pay.controller";

const router = Router();

// Xem danh sách giao dịch
router.get("/", controller.index);

// Xem chi tiết một giao dịch cụ thể
router.get("/detail/:orderId", controller.detail);

export default router;
