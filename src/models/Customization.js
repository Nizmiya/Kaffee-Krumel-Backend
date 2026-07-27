import mongoose from "mongoose";

const customizationOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    price: { type: String, default: "" },
  },
  { _id: false }
);

const customizationGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    subtitle: { type: String, default: "" },
    selectionType: {
      type: String,
      enum: ["Select", "Scale", "Checkbox", ""],
      default: "",
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    collapsed: { type: Boolean, default: false },
    options: { type: [customizationOptionSchema], default: [] },
  },
  { _id: false }
);

const customizationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    groups: { type: [customizationGroupSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Customization", customizationSchema);
