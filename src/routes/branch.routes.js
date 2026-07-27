import { Router } from "express";
import {
  listBranches,
  getBranchStats,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  updateBranchStatus,
} from "../controllers/branch.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/stats", requireAuth, allowRoles("superadmin"), getBranchStats);
router.get("/", requireAuth, allowRoles("superadmin"), listBranches);
router.get("/:id", requireAuth, allowRoles("superadmin"), getBranch);
router.post("/", requireAuth, allowRoles("superadmin"), createBranch);
router.put("/:id", requireAuth, allowRoles("superadmin"), updateBranch);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteBranch);
router.patch("/:id/status", requireAuth, allowRoles("superadmin"), updateBranchStatus);

export default router;
