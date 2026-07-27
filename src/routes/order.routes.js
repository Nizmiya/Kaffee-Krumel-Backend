import { Router } from "express";
import {
  listOrders,
  getOrder,
  advanceOrderStatus,
  deleteOrder,
  getOrderStats,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/stats", requireAuth, allowRoles("superadmin", "admin"), getOrderStats);
router.get("/", requireAuth, allowRoles("superadmin", "admin"), listOrders);
router.get("/:id", requireAuth, allowRoles("superadmin", "admin"), getOrder);
router.patch("/:id/status", requireAuth, allowRoles("superadmin", "admin"), advanceOrderStatus);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteOrder);

export default router;
