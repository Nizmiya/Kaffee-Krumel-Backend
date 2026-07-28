import multer from "multer";
import CustomerAccount from "../models/CustomerAccount.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { issueOtp, verifyOtp, checkOtpRateLimit, recordOtpIssued } from "../utils/otp.js";
import { sendOtpMail } from "../utils/mail.js";
import { uploadBufferToR2, deleteFromR2 } from "../utils/r2Upload.js";

function buildCustomerResponse(customer) {
  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    dob: customer.dob,
    gender: customer.gender,
    profileImageUrl: customer.profileImageUrl,
  };
}

export const getProfile = asyncHandler(async (req, res) => {
  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);
  return success(res, buildCustomerResponse(customer));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, dob, gender } = req.body;

  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);

  if (name !== undefined) customer.name = name;
  if (dob !== undefined) customer.dob = dob;
  if (gender !== undefined) customer.gender = gender;

  await customer.save();
  return success(res, buildCustomerResponse(customer));
});

// --- Phone change (OTP sent to the account's email, not the new phone) ---

export const phoneChangeStart = asyncHandler(async (req, res) => {
  const { newPhone } = req.body;
  if (!newPhone) return fail(res, "New phone number is required");

  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);

  const rateCheck = await checkOtpRateLimit(customer.email, "change-phone");
  if (!rateCheck.allowed) {
    return fail(res, "Too many OTP requests. Please try again after 24 hours.", 429);
  }

  const code = await issueOtp(customer.email, "change-phone", {
    customerId: customer._id.toString(),
    newPhone: String(newPhone).trim(),
  });
  await recordOtpIssued(customer.email, "change-phone");
  await sendOtpMail(customer.email, code, "change-phone");

  return success(res, { message: "OTP sent to your email" });
});

export const phoneChangeVerify = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return fail(res, "Code is required");

  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);

  const result = await verifyOtp(customer.email, "change-phone", code);
  if (!result.valid) {
    return fail(res, result.reason === "expired" ? "OTP expired" : "Invalid OTP", 400);
  }

  if (result.payload?.customerId !== customer._id.toString()) {
    return fail(res, "Invalid OTP session", 400);
  }

  customer.phone = result.payload.newPhone;
  await customer.save();

  return success(res, buildCustomerResponse(customer));
});

// --- Profile image (client compresses before upload; old R2 object is replaced) ---

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(file.mimetype));
  },
});

export const uploadProfileImageMiddleware = imageUpload.single("image");

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, "No image uploaded");

  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);

  const previousKey = customer.profileImageKey;

  const { key, url } = await uploadBufferToR2(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
  );

  customer.profileImageUrl = url;
  customer.profileImageKey = key;
  await customer.save();

  if (previousKey) await deleteFromR2(previousKey);

  return success(res, buildCustomerResponse(customer));
});
