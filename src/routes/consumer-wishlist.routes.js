import { Router } from "express";
import { listWishlist, addToWishlist, removeFromWishlist } from "../controllers/consumer-wishlist.controller.js";
import { requireCustomerAuth } from "../middleware/customerAuth.js";

const router = Router();

router.get("/", requireCustomerAuth, listWishlist);
router.post("/", requireCustomerAuth, addToWishlist);
router.delete("/:productId", requireCustomerAuth, removeFromWishlist);

export default router;
