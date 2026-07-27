import Branch from "../models/Branch.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

function buildLocationString(data) {
  return `${data.street || ""}, ${data.city || ""}, ${data.country || ""}`
    .replace(/^,\s*|,\s*$/g, "")
    .replace(/,\s*,/g, ",");
}

export const listBranches = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const q = escapeRegex(req.query.search);
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { manager: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }
  const branches = await Branch.find(filter).sort({ id: 1 });
  return success(res, toClient(branches));
});

export const getBranchStats = asyncHandler(async (_req, res) => {
  const branches = await Branch.find();
  return success(res, {
    totalBranch: branches.length,
    activeBranch: branches.filter((b) => b.status === "Active").length,
    inactiveBranch: branches.filter((b) => b.status === "Inactive").length,
  });
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ id: Number(req.params.id) });
  if (!branch) return fail(res, "Branch not found", 404);
  return success(res, toClient(branch));
});

export const createBranch = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return fail(res, "Branch name is required");
  if (!req.body.manager?.trim()) return fail(res, "Manager name is required");
  const id = await getNextSequence("branch");
  const location = buildLocationString(req.body);
  const branch = await Branch.create({ ...req.body, id, location, status: "Active" });
  return success(res, toClient(branch), 201);
});

export const updateBranch = asyncHandler(async (req, res) => {
  const location = buildLocationString(req.body);
  const branch = await Branch.findOneAndUpdate(
    { id: Number(req.params.id) },
    { ...req.body, location },
    { new: true, runValidators: true }
  );
  if (!branch) return fail(res, "Branch not found", 404);
  return success(res, toClient(branch));
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOneAndDelete({ id: Number(req.params.id) });
  if (!branch) return fail(res, "Branch not found", 404);
  return success(res, { message: "Branch deleted" });
});

export const updateBranchStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) return fail(res, "Invalid status");
  const branch = await Branch.findOneAndUpdate(
    { id: Number(req.params.id) },
    { status },
    { new: true }
  );
  if (!branch) return fail(res, "Branch not found", 404);
  return success(res, toClient(branch));
});
