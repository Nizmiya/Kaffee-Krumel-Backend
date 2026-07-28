import { Router } from "express";
import { checkout, listMyOrders, getMyOrder } from "../controllers/consumer-order.controller.js";
import { requireCustomerAuth } from "../middleware/customerAuth.js";

const router = Router();

router.post("/checkout", requireCustomerAuth, checkout);
router.get("/", requireCustomerAuth, listMyOrders);
router.get("/:id", requireCustomerAuth, getMyOrder);

export default router;
