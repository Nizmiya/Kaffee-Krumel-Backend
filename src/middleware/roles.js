import { fail } from "../utils/apiResponse.js";

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, `Forbidden: requires role(s): ${roles.join(", ")}`, 403);
    }
    next();
  };
}
