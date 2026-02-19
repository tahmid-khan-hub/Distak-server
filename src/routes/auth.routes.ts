import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/session", authMiddleware, (req, res) => {
    res.json({ 
        id: req.user?.id,
        plan: req.user?.plan,
        expiresAt: req.user?.expires_at,
     });
});

export default router;