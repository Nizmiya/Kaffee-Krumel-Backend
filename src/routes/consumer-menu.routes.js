import { Router } from "express";
import {
  listCategories,
  listProducts,
  getProduct,
  listCustomizations,
  listOffers,
} from "../controllers/consumer-menu.controller.js";

const router = Router();

router.get("/categories", listCategories);
router.get("/customizations", listCustomizations);
router.get("/offers", listOffers);
router.get("/products", listProducts);
router.get("/products/:id", getProduct);

export default router;
