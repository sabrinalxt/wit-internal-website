import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function authorizeRoles(allowedRoles: string[]) {

    return (req: AuthRequest, res: Response, next: NextFunction) => {
    
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    // Check if user has at least one allowed role
    const hasRole = req.user.roles.some(role =>
      allowedRoles.includes(role)
    );

    // No allowed role
    if (!hasRole) {
      return res.status(403).json({
        error: "Forbidden"
      });
    }

    next();
    }
}