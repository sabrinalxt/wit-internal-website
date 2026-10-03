import prisma from "../prisma/client";
import bcrypt from "bcrypt";

// Never return password_hash in a response
const publicUserSelect = {
  user_id: true,
  first_name: true,
  last_name: true,
  email: true,
  created_at: true,
} as const;

// Get all users
export const getAllUsers = async () => {
  return prisma.user.findMany({ select: publicUserSelect });
};

// Get user by ID
export const getUserById = async (user_id: number) => {
  return prisma.user.findUnique({
    where: { user_id },
    select: publicUserSelect,
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
  user_id: number,
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
    select: publicUserSelect,
  });
};

// Delete user
export const deleteUser = async (user_id: number) => {
  return prisma.user.delete({
    where: { user_id },
    select: publicUserSelect,
  });
};
