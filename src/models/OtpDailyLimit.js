import mongoose from "mongoose";

const otpDailyLimitSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ["register", "forgot", "change-phone"],
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD, resets naturally by keying on today's date
    count: { type: Number, default: 0 },
    bannedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

otpDailyLimitSchema.index({ email: 1, purpose: 1, date: 1 }, { unique: true });

export default mongoose.model("OtpDailyLimit", otpDailyLimitSchema);
