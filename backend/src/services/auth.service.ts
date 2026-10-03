import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export async function login(email: string, password: string) {
  // Find if user exists by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.password_hash) {
    throw new Error("Invalid email or password");
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  // Extract role names
  const roles = user.user_roles.map((ur) => ur.role.role_name);

  // JWT token
  const token = jwt.sign({ userId: user.user_id.toString(), roles: roles }, env.JWT_SECRET, {
    expiresIn: "10m",
  });

  return {
    token,
    user: {
      id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: roles,
    },
  };
}
