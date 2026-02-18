import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { pool } from "../db.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authMiddleware = async ( req: Request, res: Response, next: NextFunction, ) => {
  
  try {
    const token = req.cookies.chat_token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    if (token.length < 16) return res.status(400).json({ error: "Invalid token format" });

    const tokenHash = hashToken(token);

    // Check if token already exists
    const existing = await pool.query("SELECT id, expires_at FROM users WHERE token_hash = $1", [tokenHash] );

    if (existing.rowCount === 0) return res.status(401).json({ error: "Invalid token" });

    const user = existing.rows[0];

    // Check expiration
    if (user.expires_at && new Date(user.expires_at) < new Date()) { return res.status(401).json({ error: "Token expired" }); }
        
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
