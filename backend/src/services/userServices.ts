import prisma from "../prisma/client";

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

// Create new user
export const createUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string;
}) => {
  return prisma.user.create({
    data,
  });
};

// Update user
export const updateUser = async (
  user_id: bigint,
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
  }>
) => {
  return prisma.user.update({
    where: { user_id },
    data,
  });
};

// Delete user
export const deleteUser = async (user_id: bigint) => {
  return prisma.user.delete({
    where: { user_id },
  });
};
