import Offer from "../models/Offer.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import {
  toClient,
  formatDateParts,
  formatEuroPrice,
  calcComboOfferPrice,
  buildComboItemsSummary,
  mapComboProducts,
  OFFER_DESCRIPTION,
} from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

function buildOfferFilter(query) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.category && query.category !== "all") filter.category = query.category;
  if (query.search) {
    const q = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { itemsSummary: { $regex: q, $options: "i" } },
    ];
  }
  return filter;
}

export const listOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find(buildOfferFilter(req.query)).sort({ id: -1 });
  return success(res, toClient(offers));
});

export const getOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ id: Number(req.params.id) });
  if (!offer) return fail(res, "Offer not found", 404);
  return success(res, toClient(offer));
});

export const createSingleOffer = asyncHandler(async (req, res) => {
  const { start, end, product, offerPrice } = req.body;
  if (!product || !offerPrice) return fail(res, "Product and offer price are required");
  if (!start?.day || !end?.day) return fail(res, "Validity dates are required");

  const id = await getNextSequence("offer");
  const offer = await Offer.create({
    id,
    type: "single",
    name: product.name,
    category: product.category,
    status: "Active",
    image: product.image,
    validityFrom: formatDateParts(start),
    validityTo: formatDateParts(end),
    offerPrice: formatEuroPrice(offerPrice),
    originalPrice: product.price,
    description: OFFER_DESCRIPTION,
    productId: product.id,
    products: [],
  });

  return success(res, toClient(offer), 201);
});

export const createComboOffer = asyncHandler(async (req, res) => {
  const { image, title, description, start, end, products } = req.body;
  if (!title || !products?.length) return fail(res, "Title and products are required");
  if (!start?.day || !end?.day) return fail(res, "Validity dates are required");

  const offerProducts = mapComboProducts(products);
  const id = await getNextSequence("offer");

  const offer = await Offer.create({
    id,
    type: "combo",
    name: title,
    category: "Combo",
    status: "Active",
    image,
    validityFrom: formatDateParts(start),
    validityTo: formatDateParts(end),
    offerPrice: calcComboOfferPrice(offerProducts),
    description: description || OFFER_DESCRIPTION,
    itemsSummary: buildComboItemsSummary(offerProducts),
    products: offerProducts,
  });

  return success(res, toClient(offer), 201);
});

export const updateSingleOffer = asyncHandler(async (req, res) => {
  const { start, end, product, offerPrice } = req.body;
  const offer = await Offer.findOneAndUpdate(
    { id: Number(req.params.id), type: "single" },
    {
      name: product?.name,
      category: product?.category,
      image: product?.image,
      validityFrom: formatDateParts(start),
      validityTo: formatDateParts(end),
      offerPrice: formatEuroPrice(offerPrice),
      originalPrice: product?.price,
      productId: product?.id,
    },
    { new: true }
  );
  if (!offer) return fail(res, "Single offer not found", 404);
  return success(res, toClient(offer));
});

export const updateComboOffer = asyncHandler(async (req, res) => {
  const { image, title, description, start, end, products } = req.body;
  const offerProducts = mapComboProducts(products || []);

  const offer = await Offer.findOneAndUpdate(
    { id: Number(req.params.id), type: "combo" },
    {
      name: title,
      image,
      description: description || OFFER_DESCRIPTION,
      validityFrom: formatDateParts(start),
      validityTo: formatDateParts(end),
      offerPrice: calcComboOfferPrice(offerProducts),
      itemsSummary: buildComboItemsSummary(offerProducts),
      products: offerProducts,
      category: "Combo",
    },
    { new: true }
  );
  if (!offer) return fail(res, "Combo offer not found", 404);
  return success(res, toClient(offer));
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOneAndDelete({ id: Number(req.params.id) });
  if (!offer) return fail(res, "Offer not found", 404);
  return success(res, { message: "Offer deleted" });
});

export const updateOfferStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) return fail(res, "Invalid status");
  const offer = await Offer.findOneAndUpdate(
    { id: Number(req.params.id) },
    { status },
    { new: true }
  );
  if (!offer) return fail(res, "Offer not found", 404);
  return success(res, toClient(offer));
});
