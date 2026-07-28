import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";
// Customers stay logged in indefinitely — refresh tokens rotate on every use
// and are only actually revoked by the 30-day-inactivity, so the
// token's own expiry just needs to comfortably outlive that window.
export const CUSTOMER_REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
const CUSTOMER_REFRESH_EXPIRY = "30d";

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function signCustomerAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signCustomerRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: CUSTOMER_REFRESH_EXPIRY,
  });
}
