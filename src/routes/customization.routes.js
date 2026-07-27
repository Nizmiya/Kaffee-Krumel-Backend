import { Router } from "express";
import {
  listCustomizations,
  getCustomization,
  createCustomization,
  updateCustomization,
  deleteCustomization,
  updateCustomizationStatus,
} from "../controllers/customization.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", requireAuth, allowRoles("superadmin"), listCustomizations);
router.get("/:id", requireAuth, allowRoles("superadmin"), getCustomization);
router.post("/", requireAuth, allowRoles("superadmin"), createCustomization);
router.put("/:id", requireAuth, allowRoles("superadmin"), updateCustomization);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteCustomization);
router.patch("/:id/status", requireAuth, allowRoles("superadmin"), updateCustomizationStatus);

export default router;
