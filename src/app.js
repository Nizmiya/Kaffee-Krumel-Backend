import express from "express";
import path from "path";
import cors from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { fail } from "./utils/apiResponse.js";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import productRoutes from "./routes/product.routes.js";
import subCategoryRoutes from "./routes/subCategory.routes.js";
import customizationRoutes from "./routes/customization.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import usersRoutes from "./routes/users.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import consumerAuthRoutes from "./routes/consumer-auth.routes.js";
import consumerProfileRoutes from "./routes/consumer-profile.routes.js";
import consumerMenuRoutes from "./routes/consumer-menu.routes.js";
import consumerBranchRoutes from "./routes/consumer-branch.routes.js";
import consumerOrderRoutes from "./routes/consumer-order.routes.js";
import cashierOrderRoutes from "./routes/cashier-order.routes.js";
import stripeKeysRoutes from "./routes/stripe-keys.routes.js";
import consumerWishlistRoutes from "./routes/consumer-wishlist.routes.js";
import { stripeWebhook } from "./controllers/consumer-order.controller.js";

const app = express();

app.use(cors);
// Stripe webhook needs the raw request body for signature verification, so
// it's mounted with express.raw() before the global JSON body parser below.
app.post(
  "/api/consumer/orders/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Kaffee Krümel Admin API" });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sub-categories", subCategoryRoutes);
app.use("/api/customizations", customizationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/consumer/auth", consumerAuthRoutes);
app.use("/api/consumer/profile", consumerProfileRoutes);
app.use("/api/consumer/menu", consumerMenuRoutes);
app.use("/api/consumer/branches", consumerBranchRoutes);
app.use("/api/consumer/orders", consumerOrderRoutes);
app.use("/api/cashier/orders", cashierOrderRoutes);
app.use("/api/stripe-keys", stripeKeysRoutes);
app.use("/api/consumer/wishlist", consumerWishlistRoutes);

app.use((_req, res) => fail(res, "Not found", 404));

app.use(errorHandler);

export default app;
