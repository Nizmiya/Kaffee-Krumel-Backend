import multer from "multer";
import path from "path";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { uploadBufferToR2 } from "../utils/r2Upload.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, "No file uploaded");

  // Menu images only ever render at small card/thumbnail sizes on mobile —
  // no need to keep whatever multi-MB photo an admin uploads. Downscale to
  // a sane max width and re-encode as JPEG at moderate quality.
  const compressed = await sharp(req.file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const { url } = await uploadBufferToR2(compressed, "image.jpg", "image/jpeg", "menu-images");
  return success(res, { url });
});
