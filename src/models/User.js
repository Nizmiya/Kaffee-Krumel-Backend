import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const refreshTokenSchema = new mongoose.Schema(
  { token: String, createdAt: { type: Date, default: Date.now } },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "cashier"],
      required: true,
    },
    staffId: { type: Number, sparse: true, unique: true, index: true },
    // Branch staff only (admin / cashier)
    branchId: { type: Number, default: null, index: true },
    branch: { type: String, default: "" },
    manager: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdAtLabel: { type: String, default: "" },
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
