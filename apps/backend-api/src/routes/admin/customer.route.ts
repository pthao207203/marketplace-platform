import { Router } from "express";
import { getListCustomers } from "../../controllers/admin/customer.controller";

const router = Router();

router.get("/", getListCustomers);

export default router;
