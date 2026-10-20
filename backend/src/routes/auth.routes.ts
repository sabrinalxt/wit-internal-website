import express, { Request, Response } from "express";

import { login, signUp } from "../services/auth.service";

const router = express.Router();

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
    res.json(result);
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
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

export default router;
