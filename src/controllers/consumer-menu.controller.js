import Product from "../models/Product.js";
import SubCategory from "../models/SubCategory.js";
import Customization from "../models/Customization.js";
import Offer from "../models/Offer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";

// Everything here is public/guest-readable and Active-only — this mirrors
// the admin product/customization/offer models (owned by the admin side,
// not duplicated) but never exposes Inactive records or admin CRUD.

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await SubCategory.find().sort({ id: 1 });
  return success(res, toClient(categories));
});

export const listProducts = asyncHandler(async (req, res) => {
  const filter = { status: "Active" };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.subCategory && req.query.subCategory !== "all") {
    filter.subCategory = req.query.subCategory;
  }
  const products = await Product.find(filter).sort({ id: 1 });
  return success(res, toClient(products));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: Number(req.params.id), status: "Active" });
  if (!product) return fail(res, "Product not found", 404);
  return success(res, toClient(product));
});

export const listCustomizations = asyncHandler(async (_req, res) => {
  const customizations = await Customization.find({ status: "Active" }).sort({ id: 1 });
  return success(res, toClient(customizations));
});

export const listOffers = asyncHandler(async (_req, res) => {
  const offers = await Offer.find({ status: "Active" }).sort({ id: 1 });
  return success(res, toClient(offers));
});
