import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerAccount", required: true, index: true },
    productId: { type: Number, required: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
