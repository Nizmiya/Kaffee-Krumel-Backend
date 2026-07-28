import crypto from "crypto";
import OtpCode from "../models/OtpCode.js";
import OtpDailyLimit from "../models/OtpDailyLimit.js";

const OTP_LENGTH = 6;
export const OTP_TTL_MS = 3 * 60 * 1000; // 3 minutes
const MAX_PER_DAY = 3;
const BAN_HOURS = 24;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Enforces "3 OTPs per email+purpose per day, then 24h ban".
 * Returns { allowed: true } or { allowed: false, reason, bannedUntil? }.
 */
export async function checkOtpRateLimit(email, purpose) {
  const date = todayKey();
  const limit = await OtpDailyLimit.findOne({ email, purpose, date });

  if (limit?.bannedUntil && limit.bannedUntil > new Date()) {
    return { allowed: false, reason: "banned", bannedUntil: limit.bannedUntil };
  }

  if (limit && limit.count >= MAX_PER_DAY) {
    const bannedUntil = new Date(Date.now() + BAN_HOURS * 60 * 60 * 1000);
    limit.bannedUntil = bannedUntil;
    await limit.save();
    return { allowed: false, reason: "banned", bannedUntil };
  }

  return { allowed: true };
}

export async function recordOtpIssued(email, purpose) {
  const date = todayKey();
  await OtpDailyLimit.findOneAndUpdate(
    { email, purpose, date },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
}

/**
 * Creates and stores a fresh OTP for the given email/purpose, invalidating
 * any previously-issued unconsumed codes for the same email/purpose.
 */
export async function issueOtp(email, purpose, payload = null) {
  await OtpCode.deleteMany({ email, purpose, consumedAt: null });

  const code = generateOtp();
  await OtpCode.create({
    email,
    purpose,
    codeHash: hashOtp(code),
    payload,
    createdAt: new Date(),
  });

  return code;
}

/**
 * Verifies a submitted code against the latest unconsumed OTP for
 * email/purpose. Returns { valid: true, payload } or { valid: false, reason }.
 */
export async function verifyOtp(email, purpose, code) {
  const otp = await OtpCode.findOne({ email, purpose, consumedAt: null }).sort({
    createdAt: -1,
  });

  if (!otp) return { valid: false, reason: "not_found" };

  const expiresAt = new Date(otp.createdAt.getTime() + OTP_TTL_MS);
  if (expiresAt < new Date()) return { valid: false, reason: "expired" };

  if (otp.codeHash !== hashOtp(code)) return { valid: false, reason: "mismatch" };

  otp.consumedAt = new Date();
  await otp.save();

  return { valid: true, payload: otp.payload };
}
