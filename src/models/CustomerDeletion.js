import mongoose from "mongoose";

const customerDeletionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    reason: { type: String, default: "" },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("CustomerDeletion", customerDeletionSchema);
