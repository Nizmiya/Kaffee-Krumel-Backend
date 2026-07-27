import { fail } from "../utils/apiResponse.js";

export function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return fail(res, message || "Validation failed", 400);
  }

  if (err.name === "CastError") {
    return fail(res, "Invalid resource identifier", 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return fail(res, `Duplicate value for ${field}`, 409);
  }

  const status = err.status || err.statusCode || 500;
  fail(res, err.message || "Internal server error", status);
}
