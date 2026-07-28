import Stripe from "stripe";
import StripeKeys from "../models/StripeKeys.js";

// Each branch can have its own Stripe account so that branch's payments go
// directly to it. Falls back to a platform-wide STRIPE_SECRET_KEY if the
// branch hasn't configured its own keys yet — mirrors mr-bakers-api's
// checkOut.controller.js getStripeForBranch().
export async function getStripeForBranch(branchId) {
  if (branchId) {
    const keys = await StripeKeys.findOne({ branchId });
    if (keys?.stripeSecretKey) {
      return new Stripe(keys.stripeSecretKey);
    }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Platform STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Webhook signature verification uses the platform-wide secret regardless of
// which branch's Stripe account sent the event (same approach as
// mr-bakers-api's stripeWebhook.controller.js).
export function getPlatformStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
