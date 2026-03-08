import { Request, Response } from "express";
import { pool } from "../db.js";
import { hashToken } from "../utils/hash.js";
import { GenerateNickname } from "../utils/nickname.js";

export const generateTokenHandler = async(req: Request, res: Response) => {
    try {
        const { token, plan } = req.body;
        
        if(!plan || !token) return res.status(400).json({error: "Token and plan are required"}); 

        if (token.length < 16) return res.status(400).json({ error: "Invalid token format" });

        const tokenHash = hashToken(token);
        const nickname = GenerateNickname();

        // Check if token already exists in cookies
        const existingCookie = req.cookies.chat_token;

        if(existingCookie){
            const existingCookieHash = hashToken(existingCookie);

            const existingUser = await pool.query("SELECT id, plan, expires_at, nickname FROM users WHERE token_hash = $1", 
            [existingCookieHash] );

            if(existingUser.rows.length > 0) {
                const user = existingUser.rows[0];
                // Block if not expired
                if(user.expires_at && new Date(user.expires_at) > new Date()){
                    return res.status(400).json({ 
                        error: "Token already exists and is not expired",
                        expiresAt: user.expires_at,
                    });
                }
            }
        }

        // Check token uniqueness 
        const existing = await pool.query(
            "SELECT id FROM users WHERE token_hash = $1", [tokenHash] );

        if (existing.rowCount && existing.rowCount > 0) return res.status(409).json({ error: "Token already exists" });
    
        let expiresAt: Date | null = null;

        if (plan === "2h") expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        else if (plan === "6h") expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        else if (plan === "24h") expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await pool.query(
            "INSERT INTO users (token_hash, plan,  expires_at, nickname) VALUES ($1, $2, $3, $4)",
            [tokenHash, plan, expiresAt, nickname]
        );

        // set cookie
        res.cookie("chat_token", token, {
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: "lax",
            expires: expiresAt || undefined,
        });

        res.status(201).json({ success:true, message: "Token generated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
}