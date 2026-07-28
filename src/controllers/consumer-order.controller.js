import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Branch from "../models/Branch.js";
import Customization from "../models/Customization.js";
import CustomerAccount from "../models/CustomerAccount.js";
import { getNextSequence } from "../utils/idGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient, parseEuroPrice } from "../utils/frontendShape.js";
import { getStripeForBranch, getPlatformStripeClient } from "../utils/stripe.js";

function formatOrderTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function formatOrderDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

// Recomputes the cart entirely from server-side product/customization data —
// the client only sends ids/quantities/selections, never prices, so a
// tampered request can't change what gets charged.
async function buildOrderItems(items) {
  let amount = 0;
  let itemCount = 0;
  const orderItems = [];

  for (const line of items) {
    const product = await Product.findOne({ id: Number(line.productId), status: "Active" });
    if (!product) throw new Error(`Product ${line.productId} not found`);

    const quantity = Math.max(1, Number(line.quantity) || 1);
    let unitPrice;
    let sizeLabel = "";

    if (product.type === "drinks" && product.sizes?.length) {
      const size = product.sizes.find((s) => s.id === line.sizeId) || product.sizes[0];
      unitPrice = parseEuroPrice(size.price);
      sizeLabel = size.sizeName;
    } else {
      unitPrice = parseEuroPrice(product.price);
    }

    const customizations = [];
    for (const sel of line.customizations || []) {
      const customization = await Customization.findOne({
        id: Number(sel.customizationId),
        status: "Active",
      });
      const group = customization?.groups.find((g) => g.id === sel.groupId);
      const option = group?.options.find((o) => o.id === sel.optionId);
      if (!option) continue;
      const optionPrice = parseEuroPrice(option.price);
      customizations.push({ name: option.name, price: optionPrice });
      unitPrice += optionPrice;
    }

    const lineTotal = unitPrice * quantity;
    amount += lineTotal;
    itemCount += quantity;

    orderItems.push({
      name: product.name,
      size: sizeLabel,
      unitPrice,
      quantity,
      total: lineTotal,
      customizations,
    });
  }

  return { orderItems, amount, itemCount };
}

export const checkout = asyncHandler(async (req, res) => {
  const customer = await CustomerAccount.findById(req.customer.customerId);
  if (!customer) return fail(res, "Customer not found", 404);

  const { branchId, items } = req.body;
  if (!branchId) return fail(res, "branchId is required");
  if (!Array.isArray(items) || items.length === 0) return fail(res, "Cart is empty");

  const branch = await Branch.findOne({ id: Number(branchId), status: "Active" });
  if (!branch) return fail(res, "Branch not found", 404);

  let orderItems, amount, itemCount;
  try {
    ({ orderItems, amount, itemCount } = await buildOrderItems(items));
  } catch (err) {
    return fail(res, err.message, 400);
  }

  if (amount <= 0) return fail(res, "Order total must be greater than zero");

  const orderId = `ORD-${await getNextSequence("order")}`;
  const now = new Date();

  const stripe = await getStripeForBranch(branch.id);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "eur",
    metadata: { orderId, customerId: customer._id.toString() },
    automatic_payment_methods: { enabled: true },
  });

  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const order = await Order.create({
    id: orderId,
    customerName: customer.name,
    customerInitials: initials,
    avatarUrl: customer.profileImageUrl || "",
    branch: branch.name,
    branchId: branch.id,
    email: customer.email,
    itemCount,
    amount,
    status: "Pending",
    orderTime: formatOrderTime(now),
    orderDate: formatOrderDate(now),
    items: orderItems,
    customerId: customer._id,
    paymentIntentId: paymentIntent.id,
    paymentStatus: "pending",
  });

  return success(
    res,
    { orderId: order.id, clientSecret: paymentIntent.client_secret, amount },
    201
  );
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    customerId: req.customer.customerId,
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });
  return success(res, toClient(orders));
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    id: req.params.id,
    customerId: req.customer.customerId,
  });
  if (!order) return fail(res, "Order not found", 404);
  return success(res, toClient(order));
});

// Raw-body Stripe webhook — mounted separately in app.js before the JSON
// body parser, since Stripe's signature verification needs the exact bytes.
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = getPlatformStripeClient().webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    await Order.findOneAndUpdate({ paymentIntentId: intent.id }, { paymentStatus: "paid" });
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    await Order.findOneAndUpdate({ paymentIntentId: intent.id }, { paymentStatus: "failed" });
  }

  res.json({ received: true });
});
