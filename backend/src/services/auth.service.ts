import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

// Login
export async function login(emailRaw: string, password: string) {

  const email = emailRaw.trim().toLowerCase();

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


// Sign Up 
export async function signUp(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();

  // Password validation
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }

  // Verify if user email already exists 
  const user = await prisma.user.findUnique({ where: { email } });

  // Email is unapproved or already registered
  if (!user || user.password_hash !== null) {
    throw new HttpError(403, "Sign up is not available for this email");
  }

  const password_hash = await bcrypt.hash(password, 12);

  // Find user and ensures password is null before adding the password
  const result = await prisma.user.updateMany({
    where: { user_id: user.user_id, password_hash: null },
    data: { password_hash },
  });
  if (result.count === 0) {
    throw new HttpError(403, "Sign up is not available for this email");
  }

  return login(email, password);
}