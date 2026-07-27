const REQUIRED_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
