import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_ROLES = ["Admin", "Cashier"];

function mapFormRoleToDb(role) {
  if (role === "Admin") return "admin";
  if (role === "Cashier") return "cashier";
  return null;
}

function mapDbRoleToForm(role) {
  if (role === "admin") return "Admin";
  if (role === "cashier") return "Cashier";
  return role;
}

/** Shape for Users page — docs live in MongoDB `users` collection */
function shapeStaffUser(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: obj.staffId,
    branchId: obj.branchId,
    branch: obj.branch || "",
    email: obj.email,
    manager: obj.manager || "",
    createdAt: obj.createdAtLabel || "",
    role: mapDbRoleToForm(obj.role),
    status: obj.status || "Active",
  };
}

async function resolveBranch(branchNameOrId) {
  if (branchNameOrId == null || branchNameOrId === "") return null;
  if (
    typeof branchNameOrId === "number" ||
    /^\d+$/.test(String(branchNameOrId))
  ) {
    return Branch.findOne({ id: Number(branchNameOrId) });
  }
  return Branch.findOne({ name: String(branchNameOrId).trim() });
}

async function nextStaffId() {
  const last = await User.findOne({
    role: { $in: ["admin", "cashier"] },
    staffId: { $ne: null },
  })
    .sort({ staffId: -1 })
    .select("staffId");
  return (last?.staffId || 0) + 1;
}

export const listStaffUsers = asyncHandler(async (req, res) => {
  const filter = { role: { $in: ["admin", "cashier"] } };
  if (req.query.branch && req.query.branch !== "all") {
    filter.branch = req.query.branch;
  }
  if (req.query.branchId) filter.branchId = Number(req.query.branchId);
  if (req.query.role) {
    const mapped = mapFormRoleToDb(req.query.role);
    if (mapped) filter.role = mapped;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const q = escapeRegex(req.query.search);
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { manager: { $regex: q, $options: "i" } },
      { branch: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter).sort({ staffId: 1 });

  let nextId = null;
  for (const user of users) {
    if (user.staffId == null) {
      if (nextId == null) nextId = await nextStaffId();
      user.staffId = nextId;
      nextId += 1;
      await user.save();
    }
  }

  return success(res, users.map(shapeStaffUser));
});

export const getStaffStats = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: { $in: ["admin", "cashier"] } });
  return success(res, {
    totalBranch: new Set(
      users.map((u) => u.branchId || u.branch).filter(Boolean)
    ).size,
    totalUsers: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    cashier: users.filter((u) => u.role === "cashier").length,
  });
});

export const createStaffUser = asyncHandler(async (req, res) => {
  const { role, branch, branchId, manager, email, password, confirmPassword } =
    req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const dbRole = mapFormRoleToDb(role);

  if (!dbRole || !normalizedEmail || !password) {
    return fail(res, "Role, email and password are required");
  }
  if (!branch && (branchId == null || branchId === "")) {
    return fail(res, "Please select a branch");
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return fail(res, "Please enter a valid email address");
  }
  if (password !== confirmPassword) return fail(res, "Passwords do not match");
  if (!STAFF_ROLES.includes(role)) {
    return fail(res, "Role must be Admin or Cashier");
  }

  const branchDoc = await resolveBranch(branchId ?? branch);
  if (!branchDoc) return fail(res, "Selected branch does not exist");
  if (branchDoc.status === "Inactive") {
    return fail(res, "Cannot create users for an inactive branch");
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return fail(res, "Email already exists");

  const staffId = await nextStaffId();
  const now = new Date();
  const createdAtLabel = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const displayName = (manager || branchDoc.manager || normalizedEmail).trim();

  const user = await User.create({
    email: normalizedEmail,
    password,
    name: displayName,
    role: dbRole,
    branchId: branchDoc.id,
    branch: branchDoc.name,
    manager: displayName,
    status: "Active",
    createdAtLabel,
    staffId,
  });

  return success(res, shapeStaffUser(user), 201);
});

export const updateStaffUser = asyncHandler(async (req, res) => {
  const { password, confirmPassword, branch, branchId, role, ...rest } =
    req.body;
  if (password && password !== confirmPassword) {
    return fail(res, "Passwords do not match");
  }

  const staffId = Number(req.params.id);
  const user = await User.findOne({
    staffId,
    role: { $in: ["admin", "cashier"] },
  }).select("+password");
  if (!user) return fail(res, "User not found", 404);

  if (role !== undefined) {
    const dbRole = mapFormRoleToDb(role);
    if (!dbRole) return fail(res, "Role must be Admin or Cashier");
    user.role = dbRole;
  }

  if (branch != null || branchId != null) {
    const branchDoc = await resolveBranch(branchId ?? branch);
    if (!branchDoc) return fail(res, "Selected branch does not exist");
    user.branchId = branchDoc.id;
    user.branch = branchDoc.name;
    if (rest.manager === undefined) {
      user.manager = branchDoc.manager || user.manager;
      user.name = user.manager || user.name;
    }
  }

  if (rest.manager !== undefined) {
    user.manager = rest.manager;
    user.name = rest.manager || user.email;
  }
  if (rest.email !== undefined) {
    const normalizedEmail = String(rest.email).trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return fail(res, "Please enter a valid email address");
    }
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });
    if (existing) return fail(res, "Email already exists");
    user.email = normalizedEmail;
  }
  if (rest.status !== undefined) user.status = rest.status;
  if (password) user.password = password;

  await user.save();
  return success(res, shapeStaffUser(user));
});

export const deleteStaffUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({
    staffId: Number(req.params.id),
    role: { $in: ["admin", "cashier"] },
  });
  if (!user) return fail(res, "User not found", 404);
  return success(res, { message: "User deleted" });
});

export const updateStaffStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) {
    return fail(res, "Invalid status");
  }
  const user = await User.findOneAndUpdate(
    { staffId: Number(req.params.id), role: { $in: ["admin", "cashier"] } },
    { status },
    { new: true }
  );
  if (!user) return fail(res, "User not found", 404);
  return success(res, shapeStaffUser(user));
});
