import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

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

    if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
    // Old snippet
    // const decodedToken = jwt.verify(token, JWT_SECRET) as {
    //   userId: number | string;
    //   roles: string[];
    // };

    // New, safe version
    const decoded = jwt.verify(token, JWT_SECRET) as unknown;

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
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
