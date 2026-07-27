import mongoose from "mongoose";

const offerProductItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    price: { type: String, default: "" },
    image: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    discount: { type: String, default: "" },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    type: { type: String, enum: ["single", "combo"], required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    image: { type: String, default: "" },
    validityFrom: { type: String, default: "" },
    validityTo: { type: String, default: "" },
    offerPrice: { type: String, default: "" },
    originalPrice: { type: String, default: "" },
    description: { type: String, default: "" },
    itemsSummary: { type: String, default: "" },
    products: { type: [offerProductItemSchema], default: [] },
    productId: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
