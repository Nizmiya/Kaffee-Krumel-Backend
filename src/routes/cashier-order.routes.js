import { Router } from "express";
import {
  listQueue,
  listCompleted,
  advanceStatus,
  completeViaQr,
} from "../controllers/cashier-order.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

// Cashier accounts log in through the existing staff /api/auth/login and
// carry role "admin" in their token (see auth.controller.js's portalRole) —
// allowRoles("superadmin", "admin") already covers cashier tokens.
router.get("/", requireAuth, allowRoles("superadmin", "admin"), listQueue);
router.get("/completed", requireAuth, allowRoles("superadmin", "admin"), listCompleted);
router.patch("/:id/status", requireAuth, allowRoles("superadmin", "admin"), advanceStatus);
router.post("/:id/complete", requireAuth, allowRoles("superadmin", "admin"), completeViaQr);

export default router;
