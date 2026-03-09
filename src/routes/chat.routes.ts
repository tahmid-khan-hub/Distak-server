import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { pool } from "../db.js"
import { hashToken } from "../utils/hash.js"

const router = Router()

router.get("/chat", authMiddleware, async(req, res) => {
    const userId = req.user?.id;

    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.is_group, c.created_at,
                CASE 
                    WHEN c.is_group = FALSE THEN (
                        SELECT u.nickname FROM users u
                        JOIN conversation_members cm2 ON cm2.user_id = u.id
                        WHERE cm2.conversation_id = c.id AND u.id != $1
                        LIMIT 1
                    )
                    ELSE c.name
                END AS display_name
                FROM conversations c
                JOIN conversation_members cm ON cm.conversation_id = c.id
                WHERE cm.user_id = $1
                ORDER BY c.created_at DESC`,
            [userId] );

    return res.json(result.rows);
    } catch (error) {
        console.error("Get conversations error:", error);
        return res.status(500).json({ error: "Server error" });
    }
})

router.get("/chat/search/:token", authMiddleware, async(req, res) => {
    const { token } = req.params;

    if (!token) return res.status(401).json({ error: "Unauthorized" });
    if (token.length < 16) return res.status(400).json({ error: "Invalid token format" });
    
    try {
        const hashedToken = hashToken(token as string)
        const result = await pool.query(`SELECT id, nickname FROM users WHERE token_hash = $1 LIMIT 1`, [hashedToken])

        if (result.rows.length === 0) { return res.status(404).json({ error: "User not found", }) }

        const user = result.rows[0];

        if (user.id === req.user?.id) { return res.status(400).json({ error: "Cannot start conversation with yourself", }) }

        return res.json({ id: user.id, nickname: user.nickname, });
    
    } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({ error: "Server error", });
    }
})

export default router;