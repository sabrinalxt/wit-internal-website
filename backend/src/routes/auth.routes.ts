import express, { Request, Response } from "express";

import { login, signUp } from "../services/auth.service";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import { getUserById } from "../services/users.service";

const router = express.Router();
const cookieOptions = {
  httpOnly: true, // js cannot access token
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,  // helps prevent CSRF attacks
  maxAge: 10 * 60 * 1000,
  path: "/",
};

function setAuthCookie(res: Response, token: string) {
  res.cookie("wit_auth", token, cookieOptions);
}

// LOGIN route
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // Call login service
    const result = await login(email, password);
    setAuthCookie(res, result.token);
    res.json({ user: result.user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // Call signup service
    const result = await signUp(email, password);
    setAuthCookie(res, result.token);
    res.status(201).json({ user: result.user });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// Restore logged-in user from cookie after page refresh
router.get("/user", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.userId);
  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const user = await getUserById(userId);
  if (!user || user.status !== "active") {
    return res.status(401).json({ error: "User not found" });
  }

  return res.json({
    user: {
      id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: user.roles,
    },
  });
});

// Clear cookie when logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("wit_auth", { ...cookieOptions, maxAge: undefined });
  res.status(204).send();
});

export default router;
