/** Strip mongoose internals — responses match frontend TypeScript types */
export function toClient(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toClient);
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.productId;
  return obj;
}

export function formatDateParts(parts) {
  if (!parts?.day || !parts?.month || !parts?.year) return "";
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

export function formatEuroPrice(value) {
  if (!value) return "";
  const str = String(value).trim();
  return str.startsWith("€") ? str : `€${str}`;
}

/** Matches AdminOfferManagement combo offerPrice logic */
export function calcComboOfferPrice(products = []) {
  const totalDiscount = products.reduce((sum, p) => {
    const value = Number(String(p.discount ?? "").replace(",", "."));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return `€${totalDiscount.toFixed(2)}`;
}

/** Matches AdminOfferManagement itemsSummary: "2 Product + 1 Product" */
export function buildComboItemsSummary(products = []) {
  return products.map((p) => `${p.quantity} ${p.name}`).join(" + ");
}

export function mapComboProducts(products = []) {
  return products.map((p, index) => ({
    id: p.productId || index + 1,
    name: p.name,
    category: p.category,
    price: p.price,
    image: p.image,
    quantity: p.quantity,
    discount: p.discount,
  }));
}

const OFFER_DESCRIPTION =
  "Kaffe Krümel is a cozy café offering freshly brewed coffee, handcrafted beverages, delicious pastries, and light meals in a warm and welcoming atmosphere.";

export { OFFER_DESCRIPTION };
