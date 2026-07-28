import mongoose from "mongoose";

const otpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: {
      type: String,
      enum: ["register", "forgot", "change-phone"],
      required: true,
    },
    codeHash: { type: String, required: true },
    // Holds the pending payload for "register" so the account is only
    // created once the code is verified (name/passwordHash/phone), or the
    // pending new phone number for "change-phone".
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    consumedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 10 }, // TTL: purge 10min after creation (well past the 3min OTP validity)
  },
  { timestamps: false }
);

otpCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.model("OtpCode", otpCodeSchema);
