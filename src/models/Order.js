import mongoose from "mongoose";

const orderCustomizationSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    name: String,
    size: String,
    unitPrice: Number,
    quantity: Number,
    total: Number,
    customizations: { type: [orderCustomizationSchema], default: [] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    customerName: { type: String, required: true },
    customerInitials: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    branch: { type: String, required: true },
    email: { type: String, default: "" },
    itemCount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "In-Progress", "Ready", "Completed"],
      default: "Pending",
    },
    period: { type: String, enum: ["now", "weekly", "monthly"], default: "now" },
    orderTime: { type: String, default: "" },
    orderDate: { type: String, default: "" },
    items: { type: [orderItemSchema], default: [] },
    // --- Consumer app additions (additive only — admin dashboard ignores these) ---
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerAccount", index: true, default: null },
    branchId: { type: Number, index: true, default: null },
    paymentIntentId: { type: String, default: null, index: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
