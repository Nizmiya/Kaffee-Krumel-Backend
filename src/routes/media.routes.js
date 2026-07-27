import { Router } from "express";
import { upload, uploadImage } from "../controllers/media.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { fail } from "../utils/apiResponse.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  allowRoles("superadmin", "admin"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return fail(res, err.message || "Upload failed", 400);
      next();
    });
  },
  uploadImage
);

export default router;
