import prisma from "../prisma/client";
import bcrypt from "bcrypt";

// Get all users
export const getAllUsers = async () => {
  return prisma.user.findMany();
};

// Get user by ID
export const getUserById = async (user_id: bigint) => {
  return prisma.user.findUnique({
    where: { user_id },
  });
};

// Create new user (hash password here)
export const createUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) => {
  // Hash password
  const password_hash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password_hash,
    },
    select: {
      user_id: true,
      email: true,
    },
  });
};

// Update user (rehash only if password is provided)
export const updateUser = async (
  user_id: bigint,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
  }
) => {
  const updateData: any = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
  };

  // Checks if user updates password and hashes it
  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { user_id },
    data: updateData,
  });
};

// Delete user
export const deleteUser = async (user_id: bigint) => {
  return prisma.user.delete({
    where: { user_id },
  });
};
