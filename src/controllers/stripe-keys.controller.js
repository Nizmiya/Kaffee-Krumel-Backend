import StripeKeys from "../models/StripeKeys.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";

// Combined create/edit (upsert) handler, mirroring mr-bakers-api's
// stripe_keys.controller.js: update by :id if given, else upsert by branchId.
export const createOrEditStripeKeys = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { branchId, stripePublicKey, stripeSecretKey } = req.body;

  const isEmptyString = (v) => typeof v === "string" && v.trim() === "";
  if (isEmptyString(stripePublicKey) || isEmptyString(stripeSecretKey)) {
    return fail(res, "stripePublicKey and stripeSecretKey cannot be empty strings");
  }

  if (id) {
    const updateFields = {};
    if (stripePublicKey !== undefined) updateFields.stripePublicKey = stripePublicKey;
    if (stripeSecretKey !== undefined) updateFields.stripeSecretKey = stripeSecretKey;
    if (Object.keys(updateFields).length === 0) {
      return fail(res, "No valid fields provided to update");
    }
    const updated = await StripeKeys.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) return fail(res, "Stripe keys not found", 404);
    return success(res, updated);
  }

  if (!branchId) {
    return fail(res, "branchId is required when creating or updating by branch");
  }

  const existing = await StripeKeys.findOne({ branchId: Number(branchId) });
  if (existing) {
    const updateFields = {};
    if (stripePublicKey !== undefined) updateFields.stripePublicKey = stripePublicKey;
    if (stripeSecretKey !== undefined) updateFields.stripeSecretKey = stripeSecretKey;
    if (Object.keys(updateFields).length === 0) {
      return fail(res, "No valid fields provided to update");
    }
    const updated = await StripeKeys.findOneAndUpdate(
      { branchId: Number(branchId) },
      updateFields,
      { new: true }
    );
    return success(res, updated);
  }

  if (!stripePublicKey || !stripeSecretKey) {
    return fail(res, "stripePublicKey and stripeSecretKey are required to create Stripe keys");
  }

  const created = await StripeKeys.create({
    branchId: Number(branchId),
    stripePublicKey,
    stripeSecretKey,
  });
  return success(res, created, 201);
});

// Public — the app needs the publishable key for the branch it's ordering
// from to initialize Stripe with the matching account. Never returns the
// secret key.
export const getStripePublicKey = asyncHandler(async (req, res) => {
  const keys = await StripeKeys.findOne({ branchId: Number(req.params.branchId) });
  if (!keys) return fail(res, "Stripe keys not found for this branch", 404);
  return success(res, { stripePublicKey: keys.stripePublicKey });
});
