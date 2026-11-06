import { ApiError } from "../api/client";
import type { Proposal, ProposalStatus } from "../types";

// Display names for the backend statuses (tech doc: shown beside each proposal)
export const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PILLAR_APPROVED: "Pillar approved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// The requestor can only edit or (re)submit while a proposal is a draft or was rejected
export function isEditable(proposal: Proposal): boolean {
  return proposal.proposal_status === "DRAFT" || proposal.proposal_status === "REJECTED";
}

// The API refuses to submit until these are set, so we check first and say what's missing
export function missingForSubmit(proposal: Proposal): string[] {
  const missing: string[] = [];
  if (!proposal.drive_link) missing.push("a Drive link");
  if (!proposal.pillar_lead) missing.push("a pillar lead");
  if (!proposal.approver) missing.push("an approver");
  return missing;
}

// "a Drive link, a pillar lead and an approver"
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) return "Can't reach the server. Please try again.";
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}