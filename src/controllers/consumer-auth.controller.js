import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import CustomerAccount from "../models/CustomerAccount.js";
import CustomerDeletion from "../models/CustomerDeletion.js";
import OtpCode from "../models/OtpCode.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import {
  signCustomerAccessToken,
  signCustomerRefreshToken,
  verifyRefreshToken,
  CUSTOMER_REFRESH_EXPIRY_MS,
} from "../utils/jwt.js";
import { issueOtp, verifyOtp, checkOtpRateLimit, recordOtpIssued } from "../utils/otp.js";
import { sendOtpMail } from "../utils/mail.js";
import { deleteFromR2 } from "../utils/r2Upload.js";

const RESET_TOKEN_EXPIRY = "10m";
const googleClient = new OAuth2Client();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

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

async function issueSessionTokens(customer) {
  const payload = { customerId: customer._id.toString(), role: "customer" };
  const accessToken = signCustomerAccessToken(payload);
  const refreshToken = signCustomerRefreshToken(payload);

  if (!Array.isArray(customer.refreshTokens)) customer.refreshTokens = [];
  customer.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + CUSTOMER_REFRESH_EXPIRY_MS),
  });
  customer.lastActiveAt = new Date();
  await customer.save();

  return { accessToken, refreshToken };
}

// --- Registration (register -> OTP -> verify creates the account) ---

export const registerStart = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, password, phone } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!name || !email || !password) {
    return fail(res, "Name, email, and password are required");
  }

  const existing = await CustomerAccount.findOne({ email });
  if (existing) return fail(res, "Email already registered", 409);

  const rateCheck = await checkOtpRateLimit(email, "register");
  if (!rateCheck.allowed) {
    return fail(
      res,
      "Too many OTP requests. Please try again after 24 hours.",
      429
    );
  }

  const code = await issueOtp(email, "register", {
    name: name.trim(),
    password,
    phone: phone ? String(phone).trim() : null,
  });
  await recordOtpIssued(email, "register");
  await sendOtpMail(email, code, "register");

  return success(res, { email, message: "OTP sent" }, 200);
});

export const registerVerify = asyncHandler(async (req, res) => {
  const { email: rawEmail, code } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!email || !code) return fail(res, "Email and code are required");

  const existing = await CustomerAccount.findOne({ email });
  if (existing) return fail(res, "Email already registered", 409);

  const result = await verifyOtp(email, "register", code);
  if (!result.valid) {
    return fail(
      res,
      result.reason === "expired" ? "OTP expired" : "Invalid OTP",
      400
    );
  }

  const { name, password, phone } = result.payload || {};
  if (!name || !password) {
    return fail(res, "Registration session expired, please start again", 400);
  }

  const customer = new CustomerAccount({ name, email, password, phone });
  const tokens = await issueSessionTokens(customer);

  return success(
    res,
    { ...tokens, customer: buildCustomerResponse(customer) },
    201
  );
});

export const registerResend = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = normalizeEmail(rawEmail);
  if (!email) return fail(res, "Email is required");

  const existing = await CustomerAccount.findOne({ email });
  if (existing) return fail(res, "Email already registered", 409);

  const rateCheck = await checkOtpRateLimit(email, "register");
  if (!rateCheck.allowed) {
    return fail(
      res,
      "Too many OTP requests. Please try again after 24 hours.",
      429
    );
  }

  // Resend re-issues the OTP against whatever payload was last stored for
  // this email — the client must have already called /register/start once.
  const previous = await OtpCode.findOne({
    email,
    purpose: "register",
  }).sort({ createdAt: -1 });

  if (!previous?.payload) {
    return fail(res, "No pending registration found for this email", 400);
  }

  const code = await issueOtp(email, "register", previous.payload);
  await recordOtpIssued(email, "register");
  await sendOtpMail(email, code, "register");

  return success(res, { email, message: "OTP resent" });
});

// --- Login / session ---

export const login = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!email || !password) return fail(res, "Email and password are required");

  const customer = await CustomerAccount.findOne({ email, status: "active" }).select(
    "+password +refreshTokens"
  );

  if (!customer || !(await customer.comparePassword(password))) {
    return fail(res, "Invalid email or password", 401);
  }

  const tokens = await issueSessionTokens(customer);

  return success(res, { ...tokens, customer: buildCustomerResponse(customer) });
});

// --- Social login ---
// Both link-by-verified-email into an existing account rather than creating
// a duplicate, so a customer who registered with email/password and later
// taps "Sign in with Google" using the same address ends up on one account,
// not two silently-separate ones.

export const loginGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return fail(res, "idToken is required");

  const audience = (process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    return fail(res, "Invalid Google token", 401);
  }

  if (!payload?.email || !payload.email_verified) {
    return fail(res, "Google account email is not verified", 401);
  }

  const email = normalizeEmail(payload.email);
  let customer = await CustomerAccount.findOne({ googleId: payload.sub });

  if (!customer) {
    customer = await CustomerAccount.findOne({ email });
    if (customer) {
      customer.googleId = payload.sub;
    } else {
      customer = new CustomerAccount({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub,
        authProvider: "google",
        profileImageUrl: payload.picture || null,
      });
    }
    await customer.save();
  }

  if (customer.status !== "active") return fail(res, "Account not found", 404);

  const tokens = await issueSessionTokens(customer);
  return success(res, { ...tokens, customer: buildCustomerResponse(customer) });
});

export const loginApple = asyncHandler(async (req, res) => {
  const { identityToken, name } = req.body;
  if (!identityToken) return fail(res, "identityToken is required");

  let payload;
  try {
    payload = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
  } catch {
    return fail(res, "Invalid Apple token", 401);
  }

  const appleId = payload.sub;
  // Apple only includes a real email on the very first authorization —
  // later sign-ins from the same device omit it, so it can be null here.
  const email = payload.email ? normalizeEmail(payload.email) : null;

  let customer = await CustomerAccount.findOne({ appleId });

  if (!customer) {
    customer = email ? await CustomerAccount.findOne({ email }) : null;
    if (customer) {
      customer.appleId = appleId;
    } else {
      if (!email) {
        return fail(
          res,
          "Apple did not provide an email for this account — please try signing in again",
          400
        );
      }
      customer = new CustomerAccount({
        name: name?.trim() || email.split("@")[0],
        email,
        appleId,
        authProvider: "apple",
      });
    }
    await customer.save();
  }

  if (customer.status !== "active") return fail(res, "Account not found", 404);

  const tokens = await issueSessionTokens(customer);
  return success(res, { ...tokens, customer: buildCustomerResponse(customer) });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return fail(res, "Refresh token required");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return fail(res, "Refresh token expired or invalid", 401);
  }

  const customer = await CustomerAccount.findById(decoded.customerId).select(
    "+refreshTokens"
  );
  if (!customer || customer.status !== "active") {
    return fail(res, "Invalid refresh token", 401);
  }

  const stored = customer.refreshTokens.find((t) => t.token === token);
  if (!stored) return fail(res, "Invalid refresh token", 401);

  // Rotate: drop the presented token, issue a brand-new pair, cap history.
  customer.refreshTokens = customer.refreshTokens.filter((t) => t.token !== token);
  const tokens = await issueSessionTokens(customer);
  if (customer.refreshTokens.length > 5) {
    customer.refreshTokens = customer.refreshTokens.slice(-5);
    await customer.save();
  }

  return success(res, tokens);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return fail(res, "Refresh token required");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return fail(res, "Invalid refresh token");
  }

  const customer = await CustomerAccount.findById(decoded.customerId).select(
    "+refreshTokens"
  );
  if (customer) {
    customer.refreshTokens = customer.refreshTokens.filter((t) => t.token !== token);
    await customer.save();
  }

  return success(res, { message: "Logged out successfully" });
});

// --- Forgot password (same 3-min / 3-per-day OTP rules as registration) ---

export const forgotPasswordStart = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return fail(res, "Email is required");

  const customer = await CustomerAccount.findOne({ email, status: "active" });
  if (!customer) return fail(res, "No account found for this email", 404);

  const rateCheck = await checkOtpRateLimit(email, "forgot");
  if (!rateCheck.allowed) {
    return fail(res, "Too many OTP requests. Please try again after 24 hours.", 429);
  }

  const code = await issueOtp(email, "forgot");
  await recordOtpIssued(email, "forgot");
  await sendOtpMail(email, code, "forgot");

  return success(res, { email, message: "OTP sent" });
});

export const forgotPasswordVerify = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { code } = req.body;
  if (!email || !code) return fail(res, "Email and code are required");

  const customer = await CustomerAccount.findOne({ email, status: "active" });
  if (!customer) return fail(res, "No account found for this email", 404);

  const result = await verifyOtp(email, "forgot", code);
  if (!result.valid) {
    return fail(res, result.reason === "expired" ? "OTP expired" : "Invalid OTP", 400);
  }

  const resetToken = jwt.sign(
    { customerId: customer._id.toString(), purpose: "reset" },
    process.env.JWT_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY }
  );

  return success(res, { resetToken });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return fail(res, "Reset token and new password are required");
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return fail(res, "Reset session expired, please start again", 401);
  }
  if (decoded.purpose !== "reset") return fail(res, "Invalid reset token", 401);

  const customer = await CustomerAccount.findById(decoded.customerId).select("+refreshTokens");
  if (!customer) return fail(res, "Customer not found", 404);

  customer.password = newPassword;
  customer.refreshTokens = []; // force re-login on all devices
  await customer.save();

  return success(res, { message: "Password reset successfully. Please login again." });
});

// --- Change password (logged-in customer) ---

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return fail(res, "Old password, new password and confirm password are required");
  }
  if (newPassword !== confirmPassword) {
    return fail(res, "New password and confirm password do not match");
  }

  const customer = await CustomerAccount.findById(req.customer.customerId).select(
    "+password +refreshTokens"
  );
  if (!customer) return fail(res, "Customer not found", 404);

  if (!(await customer.comparePassword(oldPassword))) {
    return fail(res, "Old password is incorrect");
  }

  customer.password = newPassword;
  customer.refreshTokens = []; // force re-login on all devices
  await customer.save();

  return success(res, { message: "Password changed successfully. Please login again." });
});

// --- Delete account (permanent; keeps a name/email/reason record) ---

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password, reason } = req.body;
  if (!password) return fail(res, "Password is required");

  const customer = await CustomerAccount.findById(req.customer.customerId).select("+password");
  if (!customer) return fail(res, "Customer not found", 404);

  if (!(await customer.comparePassword(password))) {
    return fail(res, "Incorrect password");
  }

  await CustomerDeletion.create({
    name: customer.name,
    email: customer.email,
    reason: reason || "",
  });

  if (customer.profileImageKey) await deleteFromR2(customer.profileImageKey);

  await CustomerAccount.findByIdAndDelete(customer._id);

  return success(res, { message: "Account deleted successfully" });
});
