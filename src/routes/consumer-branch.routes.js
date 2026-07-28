import { Router } from "express";
import { listBranches, getBranch } from "../controllers/consumer-branch.controller.js";

const router = Router();

router.get("/", listBranches);
router.get("/:id", getBranch);

export default router;
