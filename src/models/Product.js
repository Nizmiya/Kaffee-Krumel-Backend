import mongoose from "mongoose";

const drinkInclusiveSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    customizationName: { type: String, default: "" },
    group: { type: String, default: "" },
    defaultOption: { type: String, default: "" },
    pumps: { type: String, default: "" },
  },
  { _id: false }
);

const drinkSizeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sizeName: { type: String, default: "" },
    price: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    collapsed: { type: Boolean, default: false },
    included: { type: [drinkInclusiveSchema], default: [] },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    type: { type: String, enum: ["food", "drinks"], required: true },
    name: { type: String, required: true },
    subCategory: { type: String, required: true },
    price: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    sizes: { type: [drinkSizeSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
