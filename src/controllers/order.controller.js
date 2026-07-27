import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const STATUS_FLOW = ["Pending", "In-Progress", "Ready", "Completed"];

function buildOrderFilter(query) {
  const filter = {};
  if (query.period) filter.period = query.period;
  if (query.status) filter.status = query.status;
  if (query.branch && query.branch !== "all") filter.branch = query.branch;
  if (query.search) {
    const q = escapeRegex(query.search);
    filter.$or = [
      { id: { $regex: q, $options: "i" } },
      { customerName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { branch: { $regex: q, $options: "i" } },
    ];
  }
  return filter;
}

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find(buildOrderFilter(req.query)).sort({ createdAt: -1 });
  return success(res, toClient(orders));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return fail(res, "Order not found", 404);
  return success(res, toClient(order));
});

export const advanceOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) return fail(res, "Order not found", 404);

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
    return fail(res, "Order cannot be advanced further");
  }

  order.status = STATUS_FLOW[currentIndex + 1];
  await order.save();
  return success(res, toClient(order));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ id: req.params.id });
  if (!order) return fail(res, "Order not found", 404);
  return success(res, { message: "Order deleted" });
});

export const getOrderStats = asyncHandler(async (req, res) => {
  const filter = req.query.period ? { period: req.query.period } : {};
  const orders = await Order.find(filter);

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
    inProgressOrders: orders.filter((o) => o.status === "In-Progress").length,
    completedOrders: orders.filter((o) => o.status === "Completed").length,
    totalCustomers: new Set(orders.map((o) => o.email)).size,
    productSold: String(orders.reduce((s, o) => s + o.itemCount, 0)),
    todaysRevenue: `${orders.filter((o) => o.period === "now" && o.status === "Completed").reduce((s, o) => s + o.amount, 0).toFixed(2).replace(".", ",")} €`,
    weeklyRevenue: `${orders.filter((o) => o.period === "weekly" && o.status === "Completed").reduce((s, o) => s + o.amount, 0).toFixed(2).replace(".", ",")} €`,
    monthlyRevenue: `${orders.filter((o) => o.period === "monthly" && o.status === "Completed").reduce((s, o) => s + o.amount, 0).toFixed(2).replace(".", ",")} €`,
    totalRevenue: `${orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.amount, 0).toFixed(2).replace(".", ",")} €`,
  };

  return success(res, stats);
});
