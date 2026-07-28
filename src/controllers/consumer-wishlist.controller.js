import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";

export const listWishlist = asyncHandler(async (req, res) => {
  const entries = await Wishlist.find({ customerId: req.customer.customerId });
  const productIds = entries.map((e) => e.productId);
  const products = await Product.find({ id: { $in: productIds }, status: "Active" });
  return success(res, toClient(products));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) return fail(res, "productId is required");

  const product = await Product.findOne({ id: Number(productId), status: "Active" });
  if (!product) return fail(res, "Product not found", 404);

  await Wishlist.findOneAndUpdate(
    { customerId: req.customer.customerId, productId: Number(productId) },
    { customerId: req.customer.customerId, productId: Number(productId) },
    { upsert: true }
  );
  return success(res, { message: "Added to wishlist" }, 201);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.findOneAndDelete({
    customerId: req.customer.customerId,
    productId: Number(req.params.productId),
  });
  return success(res, { message: "Removed from wishlist" });
});
