import { Router } from "express";
import {
  registerStart,
  registerVerify,
  registerResend,
  login,
  loginGoogle,
  loginApple,
  refresh,
  logout,
  forgotPasswordStart,
  forgotPasswordVerify,
  resetPassword,
  changePassword,
  deleteAccount,
} from "../controllers/consumer-auth.controller.js";
import { requireCustomerAuth } from "../middleware/customerAuth.js";

const router = Router();

router.post("/register/start", registerStart);
router.post("/register/verify", registerVerify);
router.post("/register/resend", registerResend);
router.post("/login", login);
router.post("/login/google", loginGoogle);
router.post("/login/apple", loginApple);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password/start", forgotPasswordStart);
router.post("/forgot-password/verify", forgotPasswordVerify);
router.patch("/reset-password", resetPassword);
router.patch("/change-password", requireCustomerAuth, changePassword);
router.delete("/account", requireCustomerAuth, deleteAccount);

export default router;
