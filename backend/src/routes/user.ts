import { Router } from "express";
import prisma from "../prisma/client";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userServices";

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
    const users = await getAllUsers();

    console.log("Got all users: ", users);
    res.json(serializeBigInt(users));
  } catch (error: any) {
    console.error("Error in getAllUsers: ", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /user/:id
router.get("/:id", async (req, res) => {
  console.log("GET /users/:id called");

  try {
    const user_id = BigInt(req.params.id);
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Got user: ", user);
    res.json(serializeBigInt(user));
  } catch (error: any) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /users
router.post("/", async (req, res) => {
  console.log("POST /users called");

  try {
    const { first_name, last_name, email, password_hash } = req.body;
    const newUser = await createUser({
      first_name,
      last_name,
      email,
      password_hash,
    });

    console.log("Created user: ", newUser);
    res.status(201).json(serializeBigInt(newUser));
  } catch (error: any) {
    console.error("Error in createUser: ", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /users/:id
router.put("/:id", async (req, res) => {
  console.log("PUT /users/:id called");

  try {
    const user_id = BigInt(req.params.id);

    // Check if the user exists
    const existingUser = await prisma.user.findUnique({ where: { user_id } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { first_name, last_name, email, password_hash } = req.body;

    const updatedUser = await updateUser(user_id, {
      first_name,
      last_name,
      email,
      password_hash,
    });

    console.log("Updated user:", updatedUser);
    res.status(200).json(serializeBigInt(updatedUser));
  } catch (error: any) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /users
router.delete("/:id", async (req, res) => {
  console.log("DELETE /users/:id called");

  try {
    const user_id = BigInt(req.params.id);
    const deletedUser = await deleteUser(user_id);

    console.log("Deleted user: ", deletedUser);
    res.status(200).json(serializeBigInt(deletedUser));
  } catch (error: any) {
    console.error("Error in deleteUser: ", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
