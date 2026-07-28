import { verifyAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/apiResponse.js";

export function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized: token required", 401);
  }
  try {
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (decoded.role !== "customer") {
      return fail(res, "Unauthorized: invalid token", 401);
    }
    req.customer = decoded;
    next();
  } catch {
    return fail(res, "Unauthorized: invalid or expired token", 401);
  }
}
