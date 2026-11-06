import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: {
    userId: number | string;
    roles: string[];
  };
}
// Read token from cookie
function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.headers.cookie?.split(";") ?? [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  if (!entry) return undefined;

  const value = entry.trim().slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getCookie(req, "wit_auth");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown;
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded) ||
      !("roles" in decoded)
    ) {
      return res.status(403).json({ error: "Invalid token payload" });
    }

    req.user = decoded as { userId: number | string; roles: string[] };
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
