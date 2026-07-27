import Branch from "../models/Branch.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";

const DASHBOARD_ICONS = {
  "Product Sold": "/dashboard-icons/product_sold.svg",
  "Today's Revenue": "/dashboard-icons/todays_revenue.svg",
  "Weekly Revenue": "/dashboard-icons/weekly_revenue.svg",
  "Monthly Revenue": "/dashboard-icons/monthly_revenue.svg",
  "Total Revenue": "/dashboard-icons/total_revenue.svg",
  "Total Branch": "/dashboard-icons/total_branch.svg",
  "Pending orders": "/dashboard-icons/pending_orders.svg",
  "Total Users": "/dashboard-icons/total_users.svg",
  Admin: "/dashboard-icons/admin.svg",
  Cashier: "/dashboard-icons/cashier.svg",
};

function formatEuro(amount) {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [orders, branchCount, branchUsers] = await Promise.all([
    Order.find(),
    Branch.countDocuments(),
    User.find({ role: { $in: ["admin", "cashier"] } }),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const completedOrders = orders.filter((o) => o.status === "Completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const todayRevenue = completedOrders
    .filter((o) => o.period === "now")
    .reduce((sum, o) => sum + o.amount, 0);
  const weeklyRevenue = completedOrders
    .filter((o) => o.period === "weekly")
    .reduce((sum, o) => sum + o.amount, 0);
  const monthlyRevenue = completedOrders
    .filter((o) => o.period === "monthly")
    .reduce((sum, o) => sum + o.amount, 0);
  const productSold = completedOrders.reduce((sum, o) => sum + o.itemCount, 0);
  const adminCount = branchUsers.filter((u) => u.role === "admin").length;
  const cashierCount = branchUsers.filter((u) => u.role === "cashier").length;

  const labels = [
    { label: "Product Sold", value: productSold.toLocaleString("de-DE") },
    { label: "Today's Revenue", value: formatEuro(todayRevenue) },
    { label: "Weekly Revenue", value: formatEuro(weeklyRevenue) },
    { label: "Monthly Revenue", value: formatEuro(monthlyRevenue) },
    { label: "Total Revenue", value: formatEuro(totalRevenue) },
    { label: "Total Branch", value: String(branchCount) },
    { label: "Pending orders", value: String(pendingOrders) },
    { label: "Total Users", value: String(branchUsers.length) },
    { label: "Admin", value: String(adminCount) },
    { label: "Cashier", value: String(cashierCount) },
  ];

  const stats = labels.map((item) => ({
    ...item,
    logo: DASHBOARD_ICONS[item.label],
  }));

  return success(res, { stats });
});
