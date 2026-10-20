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