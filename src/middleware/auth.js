import { verifyAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/apiResponse.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized: token required", 401);
  }
  try {
    const token = header.split(" ")[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return fail(res, "Unauthorized: invalid or expired token", 401);
  }
}
