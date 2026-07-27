import { Router } from "express";
import {
  listOffers,
  getOffer,
  createSingleOffer,
  createComboOffer,
  updateSingleOffer,
  updateComboOffer,
  deleteOffer,
  updateOfferStatus,
} from "../controllers/offer.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", requireAuth, allowRoles("superadmin", "admin"), listOffers);
router.get("/:id", requireAuth, allowRoles("superadmin", "admin"), getOffer);

// Admin: full create/update; Superadmin: no create/update per frontend logic
router.post("/single", requireAuth, allowRoles("admin"), createSingleOffer);
router.post("/combo", requireAuth, allowRoles("admin"), createComboOffer);
router.put("/single/:id", requireAuth, allowRoles("admin"), updateSingleOffer);
router.put("/combo/:id", requireAuth, allowRoles("admin"), updateComboOffer);

// Both roles can delete and toggle status
router.delete("/:id", requireAuth, allowRoles("superadmin", "admin"), deleteOffer);
router.patch("/:id/status", requireAuth, allowRoles("superadmin", "admin"), updateOfferStatus);

export default router;
