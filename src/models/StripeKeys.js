import mongoose from "mongoose";

// One Stripe account per branch — payments for that branch's orders go
// straight to that branch's own Stripe account, not a shared platform one.
// branchId matches Branch.id (Number), consistent with how Order/Product
// reference branches elsewhere in this codebase.
const stripeKeysSchema = new mongoose.Schema(
  {
    branchId: { type: Number, required: true, unique: true, index: true },
    stripePublicKey: { type: String, required: true },
    stripeSecretKey: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("StripeKeys", stripeKeysSchema);
