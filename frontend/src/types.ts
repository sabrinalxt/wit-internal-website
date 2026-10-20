export type RoleName = "Requestor" | "PillarLead" | "Approver" | "Admin" | "Viewer";

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: RoleName[];
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

// A user as the admin endpoints return them
export type AdminUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  roles: RoleName[];
  status: "pending" | "active";
};
// An event as GET /events returns it
export type CalendarEvent = {
  event_id: number;
  event_name: string;
  start_at: string;
  end_at: string | null;
  pillar: string | null;
  proposal: { proposal_id: number; proposal_name: string; proposal_type: string } | null;
  admin: { first_name: string; last_name: string };
};
