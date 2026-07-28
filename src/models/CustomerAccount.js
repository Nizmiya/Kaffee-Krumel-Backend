import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const customerAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: null, trim: true },
    password: { type: String, select: false, default: null },
    dob: { type: Date, default: null },
    gender: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
    profileImageKey: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    googleId: { type: String, default: null, sparse: true, unique: true },
    appleId: { type: String, default: null, sparse: true, unique: true },
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
    lastActiveAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

customerAccountSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

customerAccountSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("CustomerAccount", customerAccountSchema);
