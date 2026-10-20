import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authRoles";
import {
  getAllUsers,
  getUserById,
  createApprovedUser,
  updateUser,
  setUserRoles,
  deleteUser,
} from "../services/users.service";

const router = Router();

// GET /users
router.get("/", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("GET /users called");

  try {
    const users = await getAllUsers();

    console.log("Successfully retrieved all users");
    res.json(users);
  } catch (error: any) {
    console.error("Error in GET /users:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /users/:id
router.get("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("GET /users/:id called");

  try {
    const user_id = Number(req.params.id);

    if (isNaN(user_id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const user = await getUserById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Successfully retrieved user: ${user_id}`);
    res.json(user);
  } catch (error: any) {
    console.error("Error in GET /users/:id:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /users (add approved user account (include user roles))
router.post("/", async (req, res) => {
  console.log("POST /users called");

  try {
    const { first_name, last_name, email, roles } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: "First name, last name and email are required",
      });
    }

    const user = await createApprovedUser({
      first_name,
      last_name,
      email,
      roles,
    });

    console.log("Successfully created user");
    res.status(201).json(user);
  } catch (error: any) {
    console.error("Error in POST /users:", error);
    res.status(error.status ?? 500).json({ error: error.message });
  }
});

// PUT /users/:id
router.put("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  console.log("PUT /users/:id called");

  try {
    const user_id = Number(req.params.id);

    if (isNaN(user_id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { first_name, last_name, email } = req.body;

    const user = await updateUser(user_id, {
      first_name,
      last_name,
      email,
    });

    console.log(`Successfully updated user: ${user_id}`);
    res.json(user);
  } catch (error: any) {
    // Prisma throws P2025 when record doesn't exist
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    } else {
      console.error("Error in PUT /users/:id:", error);
      res.status(error.status ?? 500).json({ error: error.message });
    }
  }
});

// PUT /users/:id/roles (Update user roles)
router.put(
  "/:id/roles",
  authenticateToken,
  authorizeRoles(["Admin"]),
  async (req: AuthRequest, res: Response) => {
    console.log("PUT /users/:id/roles called");

    try {
      const user_id = Number(req.params.id);

      if (isNaN(user_id)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const { roles } = req.body;

      if (!Array.isArray(roles)) {
        return res.status(400).json({ error: "roles must be an array" });
      }

      // Restrict admin from removing their own "Admin" role
      const isSelf = String(req.user?.userId) === String(user_id);

      if (isSelf && !roles.includes("Admin")) {
        return res.status(400).json({
          error: "You cannot remove your own Admin role",
        });
      }

      const result = await setUserRoles(user_id, roles);

      console.log(`Successfully updated roles for user: ${user_id}`);
      return res.json(result);
    } catch (error: any) {
      console.error("Error in PUT /users/:id/roles:", error);
      return res.status(error.status ?? 500).json({ error: error.message });
    }
  },
);

// DELETE /users/:id (pending users only)
router.delete("/:id", async (req, res) => {
  console.log("DELETE /users/:id called");

  try {
    const user_id = Number(req.params.id);

    if (isNaN(user_id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const result = await deleteUser(user_id);

    console.log(`Successfully deleted user: ${user_id}`);
    res.json(result);
  } catch (error: any) {
    console.error("Error in DELETE /users/:id:", error);
    res.status(error.status ?? 500).json({ error: error.message });
  }
});

export default router;
