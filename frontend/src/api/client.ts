import type {
  AdminUser,
  CalendarEvent,
  LoginResponse,
  Proposal,
  ProposalReviewers,
  ProposalType,
  RoleName,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_KEY = "wit_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const AUTH_EXPIRED_EVENT = "wit:auth-expired";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<string> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.text();
}

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

export function getEvents(): Promise<CalendarEvent[]> {
  return authFetch<CalendarEvent[]>("/events");
}

export function getProposals(): Promise<Proposal[]> {
  return authFetch<Proposal[]>("/proposals");
}

export function getProposalReviewers(): Promise<ProposalReviewers> {
  return authFetch<ProposalReviewers>("/proposals/reviewers");
}

export function createProposal(input: {
  proposal_name: string;
  proposal_type: ProposalType;
  drive_link?: string;
  pillar_lead_id?: number;
  approver_id?: number;
  parent_proposal_id?: number;
}): Promise<Proposal> {
  return authFetch<Proposal>("/proposals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProposal(
  proposalId: number,
  input: {
    proposal_name: string;
    proposal_type: ProposalType;
    drive_link?: string;
    pillar_lead_id?: number;
    approver_id?: number;
    parent_proposal_id?: number;
  },
): Promise<Proposal> {
  return authFetch<Proposal>(`/proposals/${proposalId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function submitProposal(proposalId: number): Promise<Proposal> {
  return authFetch<Proposal>(`/proposals/${proposalId}/submit`, { method: "POST" });
}

export function deleteProposal(proposalId: number): Promise<void> {
  return authFetch<void>(`/proposals/${proposalId}`, { method: "DELETE" });
}
