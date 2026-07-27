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

const app = express();

app.use(cors);
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

app.use((_req, res) => fail(res, "Not found", 404));

app.use(errorHandler);

export default app;
