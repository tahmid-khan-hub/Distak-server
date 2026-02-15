import { Request, Response } from "express";
import { pool } from "../db.js";
import crypto from "crypto";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const generateTokenHandler = async(req: Request, res: Response) => {
    try {
        const { token, plan } = req.body;
        
        if(!plan || !token) return res.status(400).json({error: "Token and plan are required"}); 

        if (token.length < 16) return res.status(400).json({ error: "Invalid token format" });

        const tokenHash = hashToken(token);

        // Check if token already exists
        const existing = await pool.query(
            "SELECT id FROM users WHERE token_hash = $1", [tokenHash] );

        if (existing.rowCount && existing.rowCount > 0) return res.status(409).json({ error: "Token already exists" });
    
        let expiresAt: Date | null = null;

        if (plan === "2h") expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        else if (plan === "6h") expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        else if (plan === "24h") expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await pool.query(
            "INSERT INTO tokens (token_hash, plan,  expires_at) VALUES ($1, $2, $3)",
            [tokenHash, plan, expiresAt]
        );

        res.status(201).json({ success:true, message: "Token generated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
}