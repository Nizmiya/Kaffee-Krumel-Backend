import { Router } from "express";
import {
  listStaffUsers,
  getStaffStats,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  updateStaffStatus,
} from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

// Branch Admin / Cashier accounts — stored in `users` collection
router.get("/stats", requireAuth, allowRoles("superadmin"), getStaffStats);
router.get("/", requireAuth, allowRoles("superadmin"), listStaffUsers);
router.post("/", requireAuth, allowRoles("superadmin"), createStaffUser);
router.put("/:id", requireAuth, allowRoles("superadmin"), updateStaffUser);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteStaffUser);
router.patch(
  "/:id/status",
  requireAuth,
  allowRoles("superadmin"),
  updateStaffStatus
);

export default router;
