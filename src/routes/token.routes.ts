import { Router } from "express";
import { generateTokenHandler } from "../controllers/token.controller.js";

const router = Router();
router.post("/generate-token", generateTokenHandler);

export default router;