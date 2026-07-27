import Product from "../models/Product.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient, formatEuroPrice } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const PRODUCT_DESCRIPTION =
  "Kaffe Krümel is a cozy café offering freshly brewed coffee, handcrafted beverages, delicious pastries, and light meals in a warm and welcoming atmosphere.";

function buildProductFilter(query) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.subCategory && query.subCategory !== "all") {
    filter.subCategory = query.subCategory;
  }
  if (query.status) filter.status = query.status;
  if (query.search) {
    const q = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { subCategory: { $regex: q, $options: "i" } },
    ];
  }
  return filter;
}

function normalizeProductBody(body, type) {
  const priceValue =
    type === "drinks"
      ? body.sizes?.[0]?.price || body.price || "0"
      : body.price || "0";

  return {
    type: body.type || type,
    name: body.name,
    subCategory: body.subCategory,
    price: formatEuroPrice(priceValue),
    description: body.description || (type === "drinks" ? "Drink product" : PRODUCT_DESCRIPTION),
    image: body.image || "",
    status: body.status || "Active",
    sizes: type === "drinks" ? body.sizes || [] : [],
  };
}

export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(buildProductFilter(req.query)).sort({ id: 1 });
  return success(res, toClient(products));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: Number(req.params.id) });
  if (!product) return fail(res, "Product not found", 404);
  return success(res, toClient(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  const type = req.body.type === "drinks" ? "drinks" : "food";
  if (!req.body.name?.trim()) return fail(res, "Product name is required");
  if (!req.body.subCategory?.trim()) return fail(res, "Sub category is required");

  const id = await getNextSequence("product");
  const product = await Product.create({
    id,
    ...normalizeProductBody(req.body, type),
  });
  return success(res, toClient(product), 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findOne({ id: Number(req.params.id) });
  if (!existing) return fail(res, "Product not found", 404);

  const type = existing.type;
  const product = await Product.findOneAndUpdate(
    { id: Number(req.params.id) },
    normalizeProductBody(req.body, type),
    { new: true, runValidators: true }
  );
  return success(res, toClient(product));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: Number(req.params.id) });
  if (!product) return fail(res, "Product not found", 404);
  return success(res, { message: "Product deleted" });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) return fail(res, "Invalid status");
  const product = await Product.findOneAndUpdate(
    { id: Number(req.params.id) },
    { status },
    { new: true }
  );
  if (!product) return fail(res, "Product not found", 404);
  return success(res, toClient(product));
});

export const getOfferCatalog = asyncHandler(async (_req, res) => {
  const products = await Product.find({ status: "Active" }).sort({ id: 1 });
  const catalog = toClient(products).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.subCategory,
    price: p.price,
    image: p.image,
  }));
  return success(res, catalog);
});
