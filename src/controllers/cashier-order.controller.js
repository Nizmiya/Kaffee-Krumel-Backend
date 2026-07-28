import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, fail } from "../utils/apiResponse.js";
import { toClient } from "../utils/frontendShape.js";

const STATUS_FLOW = ["Pending", "In-Progress", "Ready", "Completed"];

// Superadmin sees every branch's queue; branch staff (admin/cashier) are
// scoped to their own branchId from the token so a cashier device only ever
// sees its own branch's orders.
function branchFilter(req) {
  if (req.user.role === "superadmin") return {};
  return req.user.branchId ? { branchId: req.user.branchId } : {};
}

export const listQueue = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    ...branchFilter(req),
    paymentStatus: "paid",
    status: { $ne: "Completed" },
  }).sort({ createdAt: -1 });
  return success(res, toClient(orders));
});

export const listCompleted = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    ...branchFilter(req),
    paymentStatus: "paid",
    status: "Completed",
  }).sort({ updatedAt: -1 });
  return success(res, toClient(orders));
});

// Moves Pending -> In-Progress -> Ready. Ready -> Completed is deliberately
// excluded here — that transition only happens via the QR scan below, so a
// cashier can't complete an order without the customer physically present.
export const advanceStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id, ...branchFilter(req) });
  if (!order) return fail(res, "Order not found", 404);

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 2) {
    return fail(res, "Scan the customer's QR code to complete this order", 400);
  }

  order.status = STATUS_FLOW[currentIndex + 1];
  await order.save();
  return success(res, toClient(order));
});

export const completeViaQr = asyncHandler(async (req, res) => {
  const { scannedOrderId } = req.body;
  if (!scannedOrderId || scannedOrderId !== req.params.id) {
    return fail(res, "Scanned code does not match this order", 400);
  }

  const order = await Order.findOne({ id: req.params.id, ...branchFilter(req) });
  if (!order) return fail(res, "Order not found", 404);
  if (order.status !== "Ready") return fail(res, "Order is not ready for completion", 400);

  order.status = "Completed";
  await order.save();
  return success(res, toClient(order));
});
