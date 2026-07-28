import { Router } from "express";
import {
  getProfile,
  updateProfile,
  phoneChangeStart,
  phoneChangeVerify,
  uploadProfileImageMiddleware,
  uploadProfileImage,
} from "../controllers/consumer-profile.controller.js";
import { requireCustomerAuth } from "../middleware/customerAuth.js";

const router = Router();

router.get("/", requireCustomerAuth, getProfile);
router.patch("/", requireCustomerAuth, updateProfile);
router.patch("/phone/start", requireCustomerAuth, phoneChangeStart);
router.patch("/phone/verify", requireCustomerAuth, phoneChangeVerify);
router.post("/image", requireCustomerAuth, uploadProfileImageMiddleware, uploadProfileImage);

export default router;
