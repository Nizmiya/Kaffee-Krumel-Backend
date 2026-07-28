import { S3Client } from "@aws-sdk/client-s3";

let client = null;

// Lazily constructed, same reason as utils/stripe.js's getStripeClient():
// ES module imports are evaluated before dotenv.config() runs, so reading
// process.env.* at this module's top level would freeze them as undefined
// forever, regardless of what .env actually contains.
export function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });
  }
  return client;
}

export function getR2Bucket() {
  return process.env.R2_BUCKET;
}

// R2 public bucket URL (Cloudflare's r2.dev domain or a custom domain bound
// to the bucket) — object keys are appended to this to form public URLs.
export function getR2PublicUrl() {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
}
