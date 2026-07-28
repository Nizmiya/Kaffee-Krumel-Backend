import Branch from "../models/Branch.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";

export const listBranches = asyncHandler(async (_req, res) => {
  const branches = await Branch.find({ status: "Active" }).sort({ id: 1 });
  return success(res, toClient(branches));
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ id: Number(req.params.id), status: "Active" });
  if (!branch) return fail(res, "Branch not found", 404);
  return success(res, toClient(branch));
});
