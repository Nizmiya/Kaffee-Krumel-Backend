import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDB } from "../config/database.js";
import { resetSequence } from "../utils/idGenerator.js";

import User from "../models/User.js";
import Branch from "../models/Branch.js";
import SubCategory from "../models/SubCategory.js";
import Product from "../models/Product.js";
import Customization from "../models/Customization.js";
import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Counter from "../models/Counter.js";

/**
 * Minimal seed — login accounts only.
 * Business data (products, offers, orders, etc.) is created via the admin UI / mobile app.
 */
async function seed() {
  await connectDB();

  await Promise.all([
    Counter.deleteMany({}),
    User.deleteMany({}),
    Branch.deleteMany({}),
    SubCategory.deleteMany({}),
    Product.deleteMany({}),
    Customization.deleteMany({}),
    Offer.deleteMany({}),
    Order.deleteMany({}),
    Customer.deleteMany({}),
  ]);

  await User.create([
    {
      email: "superadmin@kaffe.com",
      password: "superadmin123",
      name: "Super Admin",
      role: "superadmin",
    },
    {
      email: "admin@kaffe.com",
      password: "admin123",
      name: "Admin",
      role: "admin",
      staffId: 1,
      status: "Active",
      createdAtLabel: new Date().toLocaleDateString("en-GB"),
    },
  ]);

  await resetSequence("branch", 0);
  await resetSequence("subCategory", 0);
  await resetSequence("product", 0);
  await resetSequence("customization", 0);
  await resetSequence("offer", 0);
  await resetSequence("customer", 0);

  console.log("Seed completed successfully!");
  console.log("Database is empty of demo business data.");
  console.log("Login credentials:");
  console.log("  Superadmin: superadmin@kaffe.com / superadmin123");
  console.log("  Admin:      admin@kaffe.com / admin123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
