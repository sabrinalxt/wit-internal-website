import type { LoginResponse, AdminUser, RoleName, CalendarEvent } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Token storage
const TOKEN_KEY = "wit_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Errors
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getHealth(): Promise<string> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.text();
}

// Auth

// Login
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// Sign up
export async function signUp(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// Admin functionalities

export async function getUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function createApprovedUser(user: {
  first_name: string;
  last_name: string;
  email: string;
  roles: RoleName[];
}): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function updateUserRoles(userId: number, roles: RoleName[]): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users/${userId}/roles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteUser(userId: number): Promise<{ user_id: number; deleted: true }> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
// Events

export async function getEvents(): Promise<CalendarEvent[]> {
  const res = await fetch(`${API_BASE}/events`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errorBody?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
