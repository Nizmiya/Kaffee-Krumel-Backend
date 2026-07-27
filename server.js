import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./src/config/database.js";
import { validateEnv } from "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;

validateEnv();

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Kaffee Krümel API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
