import mongoose from "mongoose";

const dayHoursSchema = new mongoose.Schema(
  {
    openHour: String,
    openMinute: String,
    openPeriod: { type: String, enum: ["AM", "PM"] },
    closeHour: String,
    closeMinute: String,
    closePeriod: { type: String, enum: ["AM", "PM"] },
  },
  { _id: false }
);

const branchSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    manager: { type: String, required: true },
    location: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    description: { type: String, default: "" },
    locationName: { type: String, default: "" },
    locationCode: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },
    weekdayHours: { type: dayHoursSchema, default: () => ({}) },
    saturdayHours: { type: dayHoursSchema, default: () => ({}) },
    sundayHours: { type: dayHoursSchema, default: () => ({}) },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Branch", branchSchema);
