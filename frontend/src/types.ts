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

export type ProposalStatus = "DRAFT" | "SUBMITTED" | "PILLAR_APPROVED" | "APPROVED" | "REJECTED";
export type ProposalType = "IPA" | "FA";

export type ProposalPerson = {
  id: number;
  name: string;
};

export type Proposal = {
  proposal_id: number;
  proposal_name: string;
  proposal_type: ProposalType;
  proposal_status: ProposalStatus;
  drive_link: string | null;
  rejection_reason: string | null;
  date_submitted: string | null;
  date_reviewed: string | null;
  parent_proposal_id: number | null;
  requestor: ProposalPerson;
  pillar_lead: ProposalPerson | null;
  approver: ProposalPerson | null;
};

export type ProposalReviewer = {
  id: number;
  name: string;
};

export type ProposalReviewers = {
  pillarLeads: ProposalReviewer[];
  approvers: ProposalReviewer[];
};
