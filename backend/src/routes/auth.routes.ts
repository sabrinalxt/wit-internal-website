  import express, { Request, Response } from "express";
  import { login } from "../services/auth.service";

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

  export default router;
