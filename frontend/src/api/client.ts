import type { LoginResponse, AdminUser, RoleName, CalendarEvent } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Token storage
const TOKEN_KEY = "wit_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Fired on window when the server rejects our token. AuthContext listens and signs the user out.
export const AUTH_EXPIRED_EVENT = "wit:auth-expired";

// Errors
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Sends a request with the signed-in user's token and turns error replies into ApiError.
// A 401, or a 403 saying the token is invalid/expired, means the session is over.
// (A plain 403 "Forbidden" is a role problem, so the user stays signed in.)
async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message: string = errorBody?.error ?? `Request failed: ${res.status}`;
    if (res.status === 401 || (res.status === 403 && /invalid|expired/i.test(message))) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
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

export function getUsers(): Promise<AdminUser[]> {
  return authFetch<AdminUser[]>("/users");
}

export function createApprovedUser(user: {
  first_name: string;
  last_name: string;
  email: string;
  roles: RoleName[];
}): Promise<AdminUser> {
  return authFetch<AdminUser>("/users", { method: "POST", body: JSON.stringify(user) });
}

export function updateUserRoles(userId: number, roles: RoleName[]): Promise<AdminUser> {
  return authFetch<AdminUser>(`/users/${userId}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ roles }),
  });
}

export function deleteUser(userId: number): Promise<{ user_id: number; deleted: true }> {
  return authFetch(`/users/${userId}`, { method: "DELETE" });
}

// Events

export function getEvents(): Promise<CalendarEvent[]> {
  return authFetch<CalendarEvent[]>("/events");
}