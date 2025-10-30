import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

// Helper to convert BigInt in the db to string ==> JSON.stringify cannot handle BigInt used by Prisma
function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

// GET /users
router.get("/", async (req, res) => {
  console.log("GET /users called");
  try {
    const users = await prisma.user.findMany();
    res.json(serializeBigInt(users));

  } catch (error: any) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /users
router.post("/", async (req, res) => {
  console.log("POST /users called");
  try {
    const { first_name, last_name, email, password_hash } = req.body;
    const newUser = await prisma.user.create({
      data: { first_name, last_name, email, password_hash },
    });
    console.log("Created user:", newUser);
    res.status(201).json(serializeBigInt(newUser));

  } catch (error: any) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /users
router.delete("/:id", async (req, res) => {
  console.log("DELETE /users called");
  try {
    const user_id = BigInt(req.params.id);
    const deletedUser = await prisma.user.delete({
      where: { user_id },
    });
    console.log("Deleted user:", deletedUser);
    res.status(200).json(serializeBigInt(deletedUser));
  } catch(error: any) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: error.message})
  }
})


export default router;
