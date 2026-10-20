import { Prisma, RoleName } from "@prisma/client";
import prisma from "../prisma/client";
import { HttpError } from "../utils/httpError";

// Columns to fetch for every user query, including each user's role names.
const userSelect = {
  user_id: true,
  first_name: true,
  last_name: true,
  email: true,
  created_at: true,
  password_hash: true, // read only to work out status; never sent to the client
  user_roles: { select: { role: { select: { role_name: true } } } },
} as const;

// A user exactly as it comes out of the database with `userSelect`.
type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

// Formats a DB row into the shape the API returns:
// - drops password_hash
// - flattens user_roles into a list of role names
// - identifies user status: "pending" (no password yet) or "active" (has signed up)
function serializeUser(user: UserRow) {
  const { password_hash, user_roles, ...publicFields } = user;
  return {
    ...publicFields,
    roles: user_roles.map((userRole) => userRole.role.role_name),
    status: password_hash === null ? ("pending" as const) : ("active" as const),
  };
}

// Turns role names (e.g. ["Requestor"]) into Role rows so we have their ids
// Rejects empty lists and unknown role names.
async function resolveRoles(names: RoleName[]) {
  const uniqueRoles = [...new Set(names)];

  if (uniqueRoles.length === 0) {
    throw new HttpError(400, "At least one role is required");
  }

  const roles = await prisma.role.findMany({ where: { role_name: { in: uniqueRoles } } });

  // Fewer rows found than names requested means at least one name doesn't exist
  if (roles.length !== uniqueRoles.length) throw new HttpError(400, "Invalid role");
  return roles;
}

// READ

// Get all users (newest first)
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { created_at: "desc" },
  });
  return users.map(serializeUser);
};

// Get one user by id
export const getUserById = async (user_id: number) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: userSelect,
  });
  return user ? serializeUser(user) : null;
};

// CREATE

// When admin adds new user to the approved list
// password_hash stays null -> status "pending"
// until they claim the account through POST /auth/signup
export const createApprovedUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  roles?: RoleName[];
}) => {
  const email = data.email.trim().toLowerCase();

  // Default to "Viewer" if no role specified
  const roles = await resolveRoles(data.roles?.length ? data.roles : ["Viewer"]);

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, "A user with this email already exists");
  }

  // Create user and add roles
  const user = await prisma.user.create({
    data: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email,
      user_roles: { create: roles.map((role) => ({ role_id: role.role_id })) },
    },
    select: userSelect,
  });
  return serializeUser(user);
};

// UPDATE

// Update name/email
// Users set their passwords during sign-up
export const updateUser = async (
  user_id: number,
  data: { first_name?: string; last_name?: string; email?: string },
) => {
  try {
    const user = await prisma.user.update({
      where: { user_id },
      data: {
        // Fields left undefined are ignored by Prisma, so partial updates work
        first_name: data.first_name?.trim(),
        last_name: data.last_name?.trim(),
        email: data.email?.trim().toLowerCase(),
      },
      select: userSelect,
    });
    return serializeUser(user);
  } catch (error) {
    // P2002 = unique constraint failed (email already taken)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "A user with this email already exists");
    }
    throw error;
  }
};

// Replace a user's roles
export const setUserRoles = async (user_id: number, names: RoleName[]) => {
  const roles = await resolveRoles(names);

  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { user_id } }),
    prisma.userRole.createMany({
      data: roles.map((role) => ({ user_id, role_id: role.role_id })),
    }),
  ]);

  return getUserById(user_id);
};

// DELETE

// Only users with "pending" status can be deleted (dependency issues)
export const deleteUser = async (user_id: number) => {
  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (user.password_hash !== null) {
    throw new HttpError(409, "Only pending users can be deleted");
  }

  await prisma.user.delete({ where: { user_id } });
  return { user_id, deleted: true };
};
