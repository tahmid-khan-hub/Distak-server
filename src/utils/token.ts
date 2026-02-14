import crypto from "crypto";

export function generateToken(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}