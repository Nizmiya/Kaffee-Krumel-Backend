import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getOfferCatalog,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/catalog", requireAuth, allowRoles("superadmin", "admin"), getOfferCatalog);
router.get("/", requireAuth, allowRoles("superadmin", "admin"), listProducts);
router.get("/:id", requireAuth, allowRoles("superadmin", "admin"), getProduct);
router.post("/", requireAuth, allowRoles("superadmin"), createProduct);
router.put("/:id", requireAuth, allowRoles("superadmin"), updateProduct);
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteProduct);
router.patch("/:id/status", requireAuth, allowRoles("superadmin"), updateProductStatus);

export default router;
