import { Router } from "express";
import {
  getListCustomers,
  getCustomerDetail,
} from "../../controllers/admin/customer.controller";

const router = Router();

router.get("/", getListCustomers);
router.get("/:id", getCustomerDetail);

export default router;
