import { Router } from "express";
import prisma from "../prisma/client";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authRoles";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users.service";

const router = Router();

// GET /users
router.get("/", async (req, res) => {
  console.log("GET /users called");

  try {
    const users = await getAllUsers();

    console.log("Got all users: ", users);
    res.json(users);
  } catch (error: any) {
    console.error("Error in getAllUsers: ", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /user/:id
router.get("/:id", async (req, res) => {
  console.log("GET /users/:id called");

  try {
    const user_id = Number(req.params.id);
    // TODO(validation-error-handler): replace with real request validation
    if (isNaN(user_id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Got user: ", user);
    res.json(user);
  } catch (error: any) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /users
router.post("/", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("POST /users called");

  try {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newUser = await createUser({
      first_name,
      last_name,
      email,
      password,
    });

    console.log("Created user: ", newUser);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error in createUser: ", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /users/:id
router.put("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("PUT /users/:id called");

  try {
    const user_id = Number(req.params.id);
    // TODO(validation-error-handler): replace with real request validation
    if (isNaN(user_id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    // Check if the user exists
    const existingUser = await prisma.user.findUnique({ where: { user_id } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { first_name, last_name, email, password } = req.body;

    const updatedUser = await updateUser(user_id, {
      first_name,
      last_name,
      email,
      password,
    });

    console.log("Updated user:", updatedUser);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /users
router.delete("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("DELETE /users/:id called");

  try {
    const user_id = Number(req.params.id);
    // TODO(validation-error-handler): replace with real request validation
    if (isNaN(user_id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const deletedUser = await deleteUser(user_id);

    console.log("Deleted user: ", deletedUser);
    res.status(200).json(deletedUser);
  } catch (error: any) {
    console.error("Error in deleteUser: ", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
