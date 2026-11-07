import type {
  AdminUser,
  AuthUser,
  CalendarEvent,
  LoginResponse,
  Proposal,
  ProposalDetail,
  ProposalReviewers,
  ProposalType,
  RoleName,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include", // Uses cookies instead of localStorage tokens
  });
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
  const message: string =
    typeof errorBody?.error === "string"
      ? errorBody.error
      : (errorBody?.error?.message ?? `Request failed: ${res.status}`);
  throw new ApiError(res.status, message);
}

// --- Health & Auth ---

export async function getHealth(): Promise<string> {
  const res = await request("/health");
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.text();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function signUp(email: string, password: string): Promise<LoginResponse> {
  const res = await request("/auth/signup", {
    method: "POST",
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

// --- Users ---

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
    body: JSON.stringify(user),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateUserRoles(userId: number, roles: RoleName[]): Promise<AdminUser> {
  const res = await request(`/users/${userId}/roles`, {
    method: "PATCH",
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

// --- Events & Proposals ---

export async function getEvents(): Promise<CalendarEvent[]> {
  const res = await request("/events");
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getProposals(): Promise<Proposal[]> {
  const res = await request("/proposals");
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getProposalReviewers(): Promise<ProposalReviewers> {
  const res = await request("/proposals/reviewers");
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getProposal(proposalId: number): Promise<ProposalDetail> {
  const res = await request(`/proposals/${proposalId}`);
  if (!res.ok) return parseError(res);
  return res.json();
}

export type CreateProposalInput = {
  proposal_name: string;
  proposal_type: ProposalType;
  drive_link?: string;
  pillar_lead_id?: number;
  approver_id?: number;
  parent_proposal_id?: number;
};

export async function createProposal(input: CreateProposalInput): Promise<ProposalDetail> {
  const res = await request("/proposals", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export type UpdateProposalInput = {
  proposal_name?: string;
  drive_link?: string | null;
  pillar_lead_id?: number | null;
  approver_id?: number | null;
};

export async function updateProposal(
  proposalId: number,
  input: UpdateProposalInput,
): Promise<ProposalDetail> {
  const res = await request(`/proposals/${proposalId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function submitProposal(proposalId: number): Promise<ProposalDetail> {
  const res = await request(`/proposals/${proposalId}/submit`, { method: "POST" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function deleteProposal(proposalId: number): Promise<void> {
  const res = await request(`/proposals/${proposalId}`, { method: "DELETE" });
  if (!res.ok) return parseError(res);
}