import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    userId: number | string;
    roles: string[];
  };
}

// Verify JWT
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Parse as unknown, then check the payload shape at runtime
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown;

    // Runtime check to ensure token has the expected shape
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded) ||
      !("roles" in decoded)
    ) {
      return res.status(403).json({ error: "Invalid token payload" });
    }

    req.user = decoded as { userId: number | string; roles: string[] }; // Attach user info to request
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
