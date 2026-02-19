import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      plan: string;
      expires_at: Date | null;
    };
  }
}
