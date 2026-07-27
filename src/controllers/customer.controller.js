import Customer from "../models/Customer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export const listCustomers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const q = escapeRegex(req.query.search);
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  const customers = await Customer.find(filter).sort({ id: 1 });
  return success(res, toClient(customers));
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ id: Number(req.params.id) });
  if (!customer) return fail(res, "Customer not found", 404);
  return success(res, toClient(customer));
});

export const getCustomerStats = asyncHandler(async (_req, res) => {
  const customers = await Customer.find();
  const closed = customers.filter((c) => c.status === "Account closed");
  return success(res, {
    totalCustomers: customers.length,
    totalNewCustomers: customers.filter((c) => c.status === "Active").length,
    accountDeleted: closed.length,
  });
});

export const getClosureAnalysis = asyncHandler(async (_req, res) => {
  const customers = await Customer.find({ status: "Account closed" });
  const counts = new Map();

  for (const customer of customers) {
    const reason = (customer.closureReason || "Other").trim() || "Other";
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }

  const reasons = Array.from(counts.entries()).map(([reason, count], index) => ({
    id: index + 1,
    reason,
    count,
    isOther: reason.toLowerCase() === "other",
  }));

  return success(res, reasons);
});
