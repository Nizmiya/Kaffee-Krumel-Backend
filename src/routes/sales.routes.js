import { Router } from "express";
import {
  getTopProducts,
  getBranchPerformance,
  getSalesStats,
} from "../controllers/sales.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/stats", requireAuth, allowRoles("superadmin", "admin"), getSalesStats);
router.get("/products", requireAuth, allowRoles("superadmin", "admin"), getTopProducts);
router.get(
  "/branch-performance",
  requireAuth,
  allowRoles("superadmin"),
  getBranchPerformance
);

export default router;
