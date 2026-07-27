import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail, getRedirectTo } from "../utils/apiResponse.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

/** Frontend portal role: cashier also uses admin portal */
function portalRole(dbRole) {
  if (dbRole === "superadmin") return "superadmin";
  return "admin";
}

function staffRoleLabel(dbRole) {
  if (dbRole === "admin") return "Admin";
  if (dbRole === "cashier") return "Cashier";
  return undefined;
}

function buildPayload(user) {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: portalRole(user.role),
    name: user.name,
    staffRole: staffRoleLabel(user.role),
    branch: user.branch || undefined,
    branchId: user.branchId || undefined,
  };
}

function buildUserResponse(user) {
  const role = portalRole(user.role);
  return {
    email: user.email,
    role,
    name: user.name,
    staffRole: staffRoleLabel(user.role),
    branch: user.branch || undefined,
    branchId: user.branchId || undefined,
    redirectTo: getRedirectTo(role),
  };
}

async function pushRefreshToken(user, refreshToken) {
  if (!Array.isArray(user.refreshTokens)) user.refreshTokens = [];
  user.refreshTokens.push({ token: refreshToken });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "Email and password are required");

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select("+password +refreshTokens");

  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid email or password", 401);
  }

  if (user.role !== "superadmin" && user.status === "Inactive") {
    return fail(res, "This account is inactive. Contact superadmin.", 403);
  }

  const payload = buildPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  await pushRefreshToken(user, refreshToken);

  return success(res, {
    accessToken,
    refreshToken,
    user: buildUserResponse(user),
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return fail(res, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).select("+refreshTokens");
  if (!user || !user.refreshTokens.some((t) => t.token === refreshToken)) {
    return fail(res, "Invalid refresh token", 401);
  }
  if (user.role !== "superadmin" && user.status === "Inactive") {
    return fail(res, "This account is inactive", 403);
  }

  return success(res, {
    accessToken: signAccessToken(buildPayload(user)),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    }).select("+refreshTokens");
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken
      );
      await user.save();
    }
  }
  return success(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return fail(res, "User not found", 404);
  if (user.role !== "superadmin" && user.status === "Inactive") {
    return fail(res, "This account is inactive", 403);
  }
  return success(res, buildUserResponse(user));
});
