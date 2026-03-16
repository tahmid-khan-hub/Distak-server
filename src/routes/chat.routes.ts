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
                END AS nickname
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

router.post("/chat", authMiddleware, async(req, res) => {
    const userId = req.user?.id;
    const { targetUserId } = req.body;

    if (!targetUserId)  return res.status(400).json({ error: "targetUserId is required" });

    if(targetUserId === userId) return res.status(400).json({ error: "Cannot start conversation with yourself" });

    try {
        // check if a DM conversation already exists between these 2 users
        const existing = await pool.query(`
            SELECT c.id FROM conversations c
            JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
            JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
            WHERE c.is_group = FALSE
            LIMIT 1`,
        [userId, targetUserId]);

        if (existing.rows.length > 0)  return res.json({ id: existing.rows[0].id, alreadyExists: true });

        // create new conversation
        const ConversationResult = await pool.query(`
            INSERT INTO conversations (is_group, created_by) VALUES (FALSE, $1) RETURNING id`, 
        [userId]);

        const conversationId = ConversationResult.rows[0].id;

        // add both memebers
        await pool.query(`
            INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [conversationId, userId, targetUserId]);

        return res.status(201).json({ id: conversationId, alreadyExists: false });
    } catch (error) {
        console.error("Create conversation error:", error);
        return res.status(500).json({ error: "Server error" });
    }
  
})

export default router;