// Proposal workflow rules. Pure: no Express, no Prisma, so it is easy to read and unit test.
//
//   DRAFT ──submit──▶ SUBMITTED ──pillar-approve──▶ PILLAR_APPROVED ──approve──▶ APPROVED
//     ▲                  │                               │
//     │                reject                          reject
//     │                  ▼                               ▼
//     └───submit─────  REJECTED  ◀───────────────────────┘

export type ProposalStatus = "DRAFT" | "SUBMITTED" | "PILLAR_APPROVED" | "APPROVED" | "REJECTED";
export type ProposalAction = "submit" | "pillar-approve" | "approve" | "reject";
type ActorKind = "requestor" | "pillarLead" | "approver";
type RoleName = "Requestor" | "PillarLead" | "Approver";

export interface TransitionProposal {
  status: ProposalStatus;
  requestorId: number;
  pillarLeadId: number | null;
  approverId: number | null;
  driveLink: string | null;
}

export interface TransitionActor {
  userId: number;
  roles: string[];
}

export type TransitionFailureKind = "invalid_status" | "forbidden" | "precondition";

export type TransitionResult =
  | {
      ok: true;
      from: ProposalStatus;
      to: ProposalStatus;
      // What the service should write besides proposal_status
      setDateSubmitted: boolean;
      dateReviewed: "set" | "clear" | "keep";
      // string = store it, null = clear it, undefined = leave it alone
      rejectionReason: string | null | undefined;
      comment: string | null;
    }
  | { ok: false; kind: TransitionFailureKind; message: string };

interface Rule {
  from: ProposalStatus;
  to: ProposalStatus;
  actor: ActorKind;
}

// The transition table. reject has two rows because who may reject depends on the current status.
const RULES: Record<ProposalAction, Rule[]> = {
  submit: [
    { from: "DRAFT", to: "SUBMITTED", actor: "requestor" },
    { from: "REJECTED", to: "SUBMITTED", actor: "requestor" },
  ],
  "pillar-approve": [{ from: "SUBMITTED", to: "PILLAR_APPROVED", actor: "pillarLead" }],
  approve: [{ from: "PILLAR_APPROVED", to: "APPROVED", actor: "approver" }],
  reject: [
    { from: "SUBMITTED", to: "REJECTED", actor: "pillarLead" },
    { from: "PILLAR_APPROVED", to: "REJECTED", actor: "approver" },
  ],
};

const ACTOR_ROLE: Record<ActorKind, RoleName> = {
  requestor: "Requestor",
  pillarLead: "PillarLead",
  approver: "Approver",
};

// Statuses in which the requestor may edit the proposal
export const EDITABLE_STATUSES: ProposalStatus[] = ["DRAFT", "REJECTED"];
// Statuses in which the requestor may delete the proposal
export const DELETABLE_STATUSES: ProposalStatus[] = ["DRAFT"];

// Every role check in the app is "has any of these roles"
export function hasAnyRole(roles: string[], allowed: string[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

function assignedUserId(proposal: TransitionProposal, kind: ActorKind): number | null {
  if (kind === "requestor") return proposal.requestorId;
  if (kind === "pillarLead") return proposal.pillarLeadId;
  return proposal.approverId;
}

function isActor(proposal: TransitionProposal, actor: TransitionActor, kind: ActorKind): boolean {
  const assigned = assignedUserId(proposal, kind);
  return (
    assigned !== null && assigned === actor.userId && hasAnyRole(actor.roles, [ACTOR_ROLE[kind]])
  );
}

function fail(kind: TransitionFailureKind, message: string): TransitionResult {
  return { ok: false, kind, message };
}

// Order of checks: wrong actor (403), then wrong status (400), then missing data (400).
// A caller who may not act on a proposal never learns its status.
export function decideTransition(
  action: ProposalAction,
  proposal: TransitionProposal,
  actor: TransitionActor,
  comment?: string | null,
): TransitionResult {
  const rules = RULES[action];
  const rule = rules.find((r) => r.from === proposal.status);

  if (!rule) {
    const mayActAtAll = rules.some((r) => isActor(proposal, actor, r.actor));
    if (!mayActAtAll) {
      return fail("forbidden", `You are not allowed to ${action} this proposal`);
    }
    return fail("invalid_status", `Cannot ${action} a proposal in status ${proposal.status}`);
  }

  if (rule.actor !== "requestor" && actor.userId === proposal.requestorId) {
    return fail("forbidden", "You cannot review your own proposal");
  }
  if (!isActor(proposal, actor, rule.actor)) {
    return fail("forbidden", `You are not allowed to ${action} this proposal`);
  }

  const trimmedComment = comment?.trim() || null;

  if (action === "submit") {
    const missing: string[] = [];
    if (!proposal.driveLink) missing.push("drive_link");
    if (proposal.pillarLeadId === null) missing.push("pillar_lead_id");
    if (proposal.approverId === null) missing.push("approver_id");
    if (missing.length > 0) {
      return fail("precondition", `Cannot submit: ${missing.join(", ")} must be set first`);
    }
  }

  if (action === "reject" && !trimmedComment) {
    return fail("precondition", "A comment is required when rejecting a proposal");
  }

  return {
    ok: true,
    from: rule.from,
    to: rule.to,
    setDateSubmitted: action === "submit",
    // A resubmit starts a fresh review, so the previous outcome is cleared.
    // (The old reason is kept in the status history.)
    dateReviewed:
      action === "submit" ? "clear" : action === "approve" || action === "reject" ? "set" : "keep",
    rejectionReason: action === "reject" ? trimmedComment : action === "submit" ? null : undefined,
    comment: trimmedComment,
  };
}
