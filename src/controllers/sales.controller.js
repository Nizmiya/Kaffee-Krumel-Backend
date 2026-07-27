import Order from "../models/Order.js";
import Branch from "../models/Branch.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";

export const getTopProducts = asyncHandler(async (req, res) => {
  const period = req.query.period || "now";
  const orders = await Order.find({ period, status: "Completed" });

  const productMap = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.name;
      const existing = productMap.get(key) || {
        id: productMap.size + 1,
        name: item.name,
        category: item.size ? "Drinks" : "Food",
        subCategory: item.size ? "Cold Drinks" : "Cake",
        branch: order.branch,
        unit: 0,
        revenue: 0,
        period,
      };
      existing.unit += item.quantity;
      existing.revenue += item.total;
      productMap.set(key, existing);
    }
  }

  let products = Array.from(productMap.values());

  if (req.query.category) {
    products = products.filter((p) => p.category === req.query.category);
  }
  if (req.query.subCategory) {
    products = products.filter((p) => p.subCategory === req.query.subCategory);
  }
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(s));
  }

  return success(res, products);
});

export const getBranchPerformance = asyncHandler(async (req, res) => {
  const period = req.query.period || "now";
  const [orders, branches] = await Promise.all([
    Order.find({ period, status: "Completed" }),
    Branch.find(),
  ]);

  const branchMap = new Map();

  for (const branch of branches) {
    branchMap.set(branch.name, {
      id: branch.id,
      name: branch.name,
      area: branch.city || branch.location,
      totalRevenue: "0,00 €",
      totalOrders: "0",
    });
  }

  for (const order of orders) {
    const entry = branchMap.get(order.branch) || {
      id: branchMap.size + 1,
      name: order.branch,
      area: "",
      totalRevenue: "0,00 €",
      totalOrders: "0",
    };
    const currentRevenue = parseFloat(entry.totalRevenue.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    entry.totalRevenue = `${(currentRevenue + order.amount).toFixed(2).replace(".", ",")} €`;
    entry.totalOrders = String(Number(entry.totalOrders) + 1);
    branchMap.set(order.branch, entry);
  }

  return success(res, Array.from(branchMap.values()));
});

export const getSalesStats = asyncHandler(async (req, res) => {
  const period = req.query.period || "now";
  const orders = await Order.find({ period, status: "Completed" });
  const productSold = orders.reduce((s, o) => s + o.itemCount, 0);
  const revenue = orders.reduce((s, o) => s + o.amount, 0);

  return success(res, {
    productSold: productSold.toLocaleString("de-DE"),
    todaysRevenue: period === "now" ? `${revenue.toFixed(2).replace(".", ",")} €` : "0,00 €",
    weeklyRevenue: period === "weekly" ? `${revenue.toFixed(2).replace(".", ",")} €` : "0,00 €",
    monthlyRevenue: period === "monthly" ? `${revenue.toFixed(2).replace(".", ",")} €` : "0,00 €",
    totalRevenue: `${revenue.toFixed(2).replace(".", ",")} €`,
  });
});
