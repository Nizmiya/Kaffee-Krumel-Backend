import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["Food", "Drinks"], required: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SubCategory", subCategorySchema);
