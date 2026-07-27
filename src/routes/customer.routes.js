import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  getCustomerStats,
  getClosureAnalysis,
} from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/stats", requireAuth, allowRoles("superadmin"), getCustomerStats);
router.get("/closure-analysis", requireAuth, allowRoles("superadmin"), getClosureAnalysis);
router.get("/", requireAuth, allowRoles("superadmin"), listCustomers);
router.get("/:id", requireAuth, allowRoles("superadmin"), getCustomer);

export default router;
