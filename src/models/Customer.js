import mongoose from "mongoose";

const customerBranchInfoSchema = new mongoose.Schema(
  {
    name: String,
    area: String,
    totalSpend: String,
    totalOrders: String,
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    initials: { type: String, default: "" },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    orders: { type: Number, default: 0 },
    spend: { type: String, default: "0" },
    status: { type: String, enum: ["Active", "Account closed"], default: "Active" },
    gender: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    accountCreated: { type: String, default: "" },
    closureReason: { type: String, default: "" },
    branches: { type: [customerBranchInfoSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
