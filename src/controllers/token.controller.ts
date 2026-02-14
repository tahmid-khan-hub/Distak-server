import { Request, Response } from "express";
import { generateToken, hashToken } from "../utils/token.js";
import { pool } from "../db.js";

export const generateTokenHandler = async(req: Request, res: Response) => {
    try {
        const {plan} = req.body;
        
        if(!plan) return res.status(400).json({error: "Plan is required"}); 

        // generate token and hash it
        const token = generateToken(16);
        const tokenHash = hashToken(token);

        let expiresAt: Date | null = null;

        if (plan === "2h") expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        else if (plan === "6h") expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        else if (plan === "24h") expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await pool.query(
            "INSERT INTO tokens (token_hash, plan,  expires_at) VALUES ($1, $2, $3)",
            [tokenHash, plan, expiresAt]
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
}