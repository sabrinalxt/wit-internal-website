// src/index.ts

import "dotenv/config";           // Load .env variables
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient(); // Initialize Prisma
const port = process.env.PORT || 4000;

app.use(express.json());

// Health check route
app.get("/healt h", (_req, res) => {
  res.json({ status: "ok" });
});

// Example route using Prisma
app.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany(); // assumes you have a User model
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
