import SubCategory from "../models/SubCategory.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export const listSubCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const items = await SubCategory.find(filter).sort({ id: 1 });
  return success(res, toClient(items));
});

export const createSubCategory = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) return fail(res, "Name and category are required");

  const duplicate = await SubCategory.findOne({
    category,
    name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
  });
  if (duplicate) return fail(res, "Sub-category already exists for this category");

  const id = await getNextSequence("subCategory");
  const item = await SubCategory.create({ ...req.body, id });
  return success(res, toClient(item), 201);
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const item = await SubCategory.findOneAndUpdate(
    { id: Number(req.params.id) },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) return fail(res, "Sub-category not found", 404);
  return success(res, toClient(item));
});

export const deleteSubCategory = asyncHandler(async (req, res) => {
  const item = await SubCategory.findOneAndDelete({ id: Number(req.params.id) });
  if (!item) return fail(res, "Sub-category not found", 404);
  return success(res, { message: "Sub-category deleted" });
});
