import { Router } from "express";
import { createOrEditStripeKeys, getStripePublicKey } from "../controllers/stripe-keys.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/:branchId", getStripePublicKey);
router.post("/", requireAuth, allowRoles("superadmin", "admin"), createOrEditStripeKeys);
router.put("/:id", requireAuth, allowRoles("superadmin", "admin"), createOrEditStripeKeys);

export default router;
