import { Router } from "express";
import {
  listSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/subCategory.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", requireAuth, allowRoles("superadmin", "admin"), listSubCategories);
router.post("/", requireAuth, allowRoles("superadmin"), createSubCategory);
router.put("/:id", requireAuth, allowRoles("superadmin"), updateSubCategory);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteSubCategory);

export default router;
