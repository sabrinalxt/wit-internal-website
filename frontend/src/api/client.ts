import type { LoginResponse, AdminUser, AuthUser, RoleName } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, { ...init, credentials: "include" });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<never> {
  const errorBody = await res.json().catch(() => null);
  throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
}

export async function getHealth(): Promise<string> {
  const res = await request("/health");
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.text();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function signUp(email: string, password: string): Promise<LoginResponse> {
  const res = await request("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const res = await request("/auth/user");
  if (!res.ok) return parseError(res);
  const result: { user: AuthUser } = await res.json();
  return result.user;
}

export async function logout(): Promise<void> {
  const res = await request("/auth/logout", { method: "POST" });
  if (!res.ok) return parseError(res);
}

export async function getUsers(): Promise<AdminUser[]> {
  const res = await request("/users");
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function createApprovedUser(user: {
  first_name: string;
  last_name: string;
  email: string;
  roles: RoleName[];
}): Promise<AdminUser> {
  const res = await request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateUserRoles(userId: number, roles: RoleName[]): Promise<AdminUser> {
  const res = await request(`/users/${userId}/roles`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function deleteUser(userId: number): Promise<{ user_id: number; deleted: true }> {
  const res = await request(`/users/${userId}`, { method: "DELETE" });
  if (!res.ok) return parseError(res);
  return res.json();
}
