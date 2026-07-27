import Customization from "../models/Customization.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";
function deriveStatus(groups) {
  if (!groups?.length) return "Active";
  return groups.every((g) => g.status === "Active") ? "Active" : "Inactive";
}

export const listCustomizations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: "i" };
  const items = await Customization.find(filter).sort({ id: 1 });
  return success(res, toClient(items));
});

export const getCustomization = asyncHandler(async (req, res) => {
  const item = await Customization.findOne({ id: Number(req.params.id) });
  if (!item) return fail(res, "Customization not found", 404);
  return success(res, toClient(item));
});

export const createCustomization = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return fail(res, "Customization name is required");
  const id = await getNextSequence("customization");
  const status = deriveStatus(req.body.groups);
  const item = await Customization.create({ ...req.body, id, status });
  return success(res, toClient(item), 201);
});

export const updateCustomization = asyncHandler(async (req, res) => {
  const status = deriveStatus(req.body.groups);
  const item = await Customization.findOneAndUpdate(
    { id: Number(req.params.id) },
    { ...req.body, status },
    { new: true, runValidators: true }
  );
  if (!item) return fail(res, "Customization not found", 404);
  return success(res, toClient(item));
});

export const deleteCustomization = asyncHandler(async (req, res) => {
  const item = await Customization.findOneAndDelete({ id: Number(req.params.id) });
  if (!item) return fail(res, "Customization not found", 404);
  return success(res, { message: "Customization deleted" });
});

export const updateCustomizationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) return fail(res, "Invalid status");

  const item = await Customization.findOne({ id: Number(req.params.id) });
  if (!item) return fail(res, "Customization not found", 404);

  item.groups = item.groups.map((group) => ({
    ...group.toObject(),
    status,
  }));
  item.status = status;
  await item.save();

  return success(res, toClient(item));
});
