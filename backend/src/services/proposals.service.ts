import { Prisma, ProposalStatus, ProposalType, RoleName } from "@prisma/client";
import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import {
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
  ProposalAction,
  TransitionFailureKind,
  decideTransition,
  hasAnyRole,
} from "./proposalTransitions";
import {
  Contact,
  notify,
  sendProposalApprovedEmail,
  sendProposalPillarApprovedEmail,
  sendProposalRejectedEmail,
  sendProposalSubmittedEmail,
} from "./email";

// The verified token's user. Always built from req.user, never from the request body.
export interface Actor {
  userId: number;
  roles: string[];
}

const personSelect = { user_id: true, first_name: true, last_name: true } as const;

const listInclude = {
  requestor: { select: personSelect },
  pillar_lead: { select: personSelect },
  approver: { select: personSelect },
} satisfies Prisma.ProposalInclude;

const detailInclude = {
  ...listInclude,
  parent: { select: { proposal_id: true, proposal_name: true, proposal_status: true } },
  status_history: {
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
    include: { changed_by: { select: personSelect } },
  },
} satisfies Prisma.ProposalInclude;

type PersonRow = { user_id: number; first_name: string; last_name: string };
type ListRow = Prisma.ProposalGetPayload<{ include: typeof listInclude }>;
type DetailRow = Prisma.ProposalGetPayload<{ include: typeof detailInclude }>;

// Never expose anything beyond id and name (no email, no password_hash)
function toPerson(user: PersonRow) {
  return { id: user.user_id, name: `${user.first_name} ${user.last_name}` };
}

function toListItem(p: ListRow) {
  return {
    proposal_id: p.proposal_id,
    proposal_name: p.proposal_name,
    proposal_type: p.proposal_type,
    proposal_status: p.proposal_status,
    drive_link: p.drive_link,
    rejection_reason: p.rejection_reason,
    date_submitted: p.date_submitted,
    date_reviewed: p.date_reviewed,
    parent_proposal_id: p.parent_proposal_id,
    requestor: toPerson(p.requestor),
    pillar_lead: p.pillar_lead ? toPerson(p.pillar_lead) : null,
    approver: p.approver ? toPerson(p.approver) : null,
  };
}

function toDetail(p: DetailRow) {
  return {
    ...toListItem(p),
    parent: p.parent
      ? { id: p.parent.proposal_id, name: p.parent.proposal_name, status: p.parent.proposal_status }
      : null,
    status_history: p.status_history.map((h) => ({
      id: h.id,
      from_status: h.from_status,
      to_status: h.to_status,
      comment: h.comment,
      created_at: h.created_at,
      changed_by: toPerson(h.changed_by),
    })),
  };
}

// ---------- small explicit input checks ----------
// TODO(validation-error-handler): replace these with the team's central request validation

function badRequest(message: string): AppError {
  return new AppError(400, message);
}

function requireRole(actor: Actor, allowed: RoleName[], message: string) {
  if (!hasAnyRole(actor.roles, allowed)) {
    throw new AppError(403, message);
  }
}

function requiredName(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest("proposal_name is required");
  }
  if (value.trim().length > 255) {
    throw badRequest("proposal_name must be at most 255 characters");
  }
  return value.trim();
}

// undefined = not provided, null = explicitly empty
function optionalDriveLink(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string" || value.length > 512) {
    throw badRequest("drive_link must be a valid https URL of at most 512 characters");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw badRequest("drive_link must be a valid https URL");
  }
  if (url.protocol !== "https:") {
    throw badRequest("drive_link must be a valid https URL");
  }
  return value;
}

function optionalUserId(value: unknown, field: string): number | null | undefined {
  if (value === undefined || value === null) return value;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return value;
}

function parseEnumQuery<T extends string>(
  value: unknown,
  allowed: Record<string, T>,
  field: string,
): T | undefined {
  if (value === undefined) return undefined;
  const options = Object.values(allowed);
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw badRequest(`${field} must be one of: ${options.join(", ")}`);
  }
  return value as T;
}

// The assigned reviewer must hold the matching role, and cannot be the requestor
async function checkReviewer(
  userId: number,
  role: RoleName,
  field: string,
  requestorId: number,
): Promise<void> {
  if (userId === requestorId) {
    throw badRequest(`${field} cannot be the requestor of the proposal`);
  }
  const user = await prisma.user.findFirst({
    where: { user_id: userId, user_roles: { some: { role: { role_name: role } } } },
    select: { user_id: true },
  });
  if (!user) {
    throw badRequest(`${field} must belong to a user with the ${role} role`);
  }
}

// ---------- reads ----------

function canView(
  actor: Actor,
  p: { requestor_id: number; pillar_lead_id: number | null; proposal_status: ProposalStatus },
) {
  const isDraft = p.proposal_status === "DRAFT";
  if (hasAnyRole(actor.roles, ["Requestor"]) && p.requestor_id === actor.userId) return true;
  if (isDraft) return false;
  if (hasAnyRole(actor.roles, ["PillarLead"]) && p.pillar_lead_id === actor.userId) return true;
  return hasAnyRole(actor.roles, ["Approver", "Admin"]);
}

export async function listProposals(actor: Actor, query: { status?: unknown; type?: unknown }) {
  const status = parseEnumQuery(query.status, ProposalStatus, "status");
  const type = parseEnumQuery(query.type, ProposalType, "type");

  // Union of what each of the caller's roles may see; OR never returns duplicates
  const visibleTo: Prisma.ProposalWhereInput[] = [];
  if (hasAnyRole(actor.roles, ["Requestor"])) {
    visibleTo.push({ requestor_id: actor.userId });
  }
  if (hasAnyRole(actor.roles, ["PillarLead"])) {
    visibleTo.push({ pillar_lead_id: actor.userId, proposal_status: { not: "DRAFT" } });
  }
  if (hasAnyRole(actor.roles, ["Approver", "Admin"])) {
    visibleTo.push({ proposal_status: { not: "DRAFT" } });
  }
  if (visibleTo.length === 0) return [];

  const rows = await prisma.proposal.findMany({
    where: {
      AND: [
        { OR: visibleTo },
        ...(status ? [{ proposal_status: status }] : []),
        ...(type ? [{ proposal_type: type }] : []),
      ],
    },
    include: listInclude,
    orderBy: { proposal_id: "desc" },
  });
  return rows.map(toListItem);
}

async function loadDetail(proposal_id: number) {
  const row = await prisma.proposal.findUnique({ where: { proposal_id }, include: detailInclude });
  if (!row) throw new AppError(404, "Proposal not found");
  return row;
}

export async function getProposal(actor: Actor, proposal_id: number) {
  const row = await loadDetail(proposal_id);
  if (!canView(actor, row)) {
    throw new AppError(403, "You are not allowed to view this proposal");
  }
  return toDetail(row);
}

export async function listReviewers(actor: Actor) {
  requireRole(actor, ["Requestor", "Admin"], "Only requestors and admins can list reviewers");

  const withRole = async (role: RoleName) => {
    const users = await prisma.user.findMany({
      where: { user_roles: { some: { role: { role_name: role } } } },
      select: personSelect,
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    });
    return users.map(toPerson);
  };

  return {
    pillarLeads: await withRole("PillarLead"),
    approvers: await withRole("Approver"),
  };
}

// ---------- create / update / delete ----------

export async function createProposal(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["Requestor"], "Only requestors can create proposals");

  const proposal_name = requiredName(body.proposal_name);
  const proposal_type = parseEnumQuery(body.proposal_type, ProposalType, "proposal_type");
  if (!proposal_type) throw badRequest("proposal_type is required (IPA or FA)");
  const drive_link = optionalDriveLink(body.drive_link);
  const pillar_lead_id = optionalUserId(body.pillar_lead_id, "pillar_lead_id");
  const approver_id = optionalUserId(body.approver_id, "approver_id");
  const parent_proposal_id = optionalUserId(body.parent_proposal_id, "parent_proposal_id");

  if (pillar_lead_id) {
    await checkReviewer(pillar_lead_id, "PillarLead", "pillar_lead_id", actor.userId);
  }
  if (approver_id) {
    await checkReviewer(approver_id, "Approver", "approver_id", actor.userId);
  }

  if (proposal_type === "IPA" && parent_proposal_id) {
    throw badRequest("An IPA cannot have a parent_proposal_id");
  }
  if (proposal_type === "FA") {
    if (!parent_proposal_id) {
      throw badRequest("An FA requires parent_proposal_id (an approved IPA)");
    }
    const parent = await prisma.proposal.findUnique({ where: { proposal_id: parent_proposal_id } });
    if (!parent) {
      throw badRequest("parent_proposal_id does not point to an existing proposal");
    }
    if (parent.proposal_type !== "IPA") {
      throw badRequest("parent_proposal_id must point to an IPA");
    }
    if (parent.requestor_id !== actor.userId) {
      throw badRequest("parent_proposal_id must point to one of your own IPAs");
    }
    if (parent.proposal_status !== "APPROVED") {
      throw badRequest("The parent IPA must be APPROVED before an FA can be created from it");
    }
  }

  const created = await prisma.proposal.create({
    data: {
      proposal_name,
      proposal_type,
      drive_link,
      pillar_lead_id,
      approver_id,
      parent_proposal_id: proposal_type === "FA" ? parent_proposal_id : null,
      requestor_id: actor.userId,
    },
  });
  return toDetail(await loadDetail(created.proposal_id));
}

// Load a proposal for a requestor-only action (edit, delete)
async function loadOwned(actor: Actor, proposal_id: number) {
  const proposal = await prisma.proposal.findUnique({ where: { proposal_id } });
  if (!proposal) throw new AppError(404, "Proposal not found");
  if (!hasAnyRole(actor.roles, ["Requestor"]) || proposal.requestor_id !== actor.userId) {
    throw new AppError(403, "Only the requestor of this proposal can do that");
  }
  return proposal;
}

export async function updateProposal(
  actor: Actor,
  proposal_id: number,
  body: Record<string, unknown>,
) {
  const existing = await loadOwned(actor, proposal_id);
  if (!EDITABLE_STATUSES.includes(existing.proposal_status)) {
    throw badRequest(`Cannot edit a proposal in status ${existing.proposal_status}`);
  }

  // Type and parent are fixed once created (sending the current value back is fine)
  if (body.proposal_type !== undefined && body.proposal_type !== existing.proposal_type) {
    throw badRequest("proposal_type cannot be changed");
  }
  if (
    body.parent_proposal_id !== undefined &&
    body.parent_proposal_id !== existing.parent_proposal_id
  ) {
    throw badRequest("parent_proposal_id cannot be changed");
  }

  const data: Prisma.ProposalUncheckedUpdateInput = {};
  if (body.proposal_name !== undefined) data.proposal_name = requiredName(body.proposal_name);
  const drive_link = optionalDriveLink(body.drive_link);
  if (drive_link !== undefined) data.drive_link = drive_link;

  const pillar_lead_id = optionalUserId(body.pillar_lead_id, "pillar_lead_id");
  if (pillar_lead_id) {
    await checkReviewer(pillar_lead_id, "PillarLead", "pillar_lead_id", existing.requestor_id);
  }
  if (pillar_lead_id !== undefined) data.pillar_lead_id = pillar_lead_id;

  const approver_id = optionalUserId(body.approver_id, "approver_id");
  if (approver_id) {
    await checkReviewer(approver_id, "Approver", "approver_id", existing.requestor_id);
  }
  if (approver_id !== undefined) data.approver_id = approver_id;

  await prisma.proposal.update({ where: { proposal_id }, data });
  return toDetail(await loadDetail(proposal_id));
}

export async function deleteProposal(actor: Actor, proposal_id: number) {
  const existing = await loadOwned(actor, proposal_id);
  if (!DELETABLE_STATUSES.includes(existing.proposal_status)) {
    throw badRequest(`Cannot delete a proposal in status ${existing.proposal_status}`);
  }
  await prisma.proposal.delete({ where: { proposal_id } });
}

const contactSelect = { first_name: true, last_name: true, email: true } as const;

type ContactRow = { first_name: string; last_name: string; email: string };

function toContact(user: ContactRow): Contact {
  return { name: `${user.first_name} ${user.last_name}`, email: user.email };
}

async function loadNotificationContext(proposal_id: number) {
  const proposal = await prisma.proposal.findUnique({
    where: { proposal_id },
    select: {
      proposal_id: true,
      proposal_name: true,
      proposal_type: true,
      requestor: { select: contactSelect },
      pillar_lead: { select: contactSelect },
      approver: { select: contactSelect },
    },
  });
  if (!proposal) return null;

  return {
    base: {
      proposalId: proposal.proposal_id,
      proposalName: proposal.proposal_name,
      proposalType: proposal.proposal_type,
      requestor: toContact(proposal.requestor),
    },
    pillarLead: proposal.pillar_lead ? toContact(proposal.pillar_lead) : null,
    approver: proposal.approver ? toContact(proposal.approver) : null,
  };
}

// ---------- workflow transitions ----------
const FAILURE_STATUS: Record<TransitionFailureKind, number> = {
  forbidden: 403,
  invalid_status: 400,
  precondition: 400,
};

// Checks the rules, then updates the proposal and writes its history row in ONE transaction
async function applyTransition(
  action: ProposalAction,
  actor: Actor,
  proposal_id: number,
  comment?: string | null,
) {
  const proposal = await prisma.proposal.findUnique({ where: { proposal_id } });
  if (!proposal) throw new AppError(404, "Proposal not found");

  const decision = decideTransition(
    action,
    {
      status: proposal.proposal_status,
      requestorId: proposal.requestor_id,
      pillarLeadId: proposal.pillar_lead_id,
      approverId: proposal.approver_id,
      driveLink: proposal.drive_link,
    },
    actor,
    comment,
  );
  if (!decision.ok) {
    throw new AppError(FAILURE_STATUS[decision.kind], decision.message);
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Only update if nobody else moved the proposal since we read it
    const updated = await tx.proposal.updateMany({
      where: { proposal_id, proposal_status: decision.from },
      data: {
        proposal_status: decision.to,
        date_submitted: decision.setDateSubmitted ? now : undefined,
        date_reviewed:
          decision.dateReviewed === "set"
            ? now
            : decision.dateReviewed === "clear"
              ? null
              : undefined,
        rejection_reason: decision.rejectionReason,
      },
    });
    if (updated.count !== 1) {
      throw new AppError(409, "The proposal status changed while processing; please reload");
    }
    await tx.proposalStatusHistory.create({
      data: {
        proposal_id,
        from_status: decision.from,
        to_status: decision.to,
        changed_by_id: actor.userId,
        comment: decision.comment,
      },
    });
  });

  return toDetail(await loadDetail(proposal_id));
}

export async function submitProposal(actor: Actor, proposal_id: number) {
  const result = await applyTransition("submit", actor, proposal_id);

  notify("proposal submitted", async () => {
    const context = await loadNotificationContext(proposal_id);

    if (!context?.pillarLead) return;

    await sendProposalSubmittedEmail({
      ...context.base,
      recipient: context.pillarLead,
    });
  });

  return result;
}

export async function pillarApproveProposal(actor: Actor, proposal_id: number) {
  const result = await applyTransition("pillar-approve", actor, proposal_id);
  notify("proposal pillar-approved", async () => {
    const context = await loadNotificationContext(proposal_id);
    if (!context?.approver) return;
    const pillarLead = result.status_history.at(-1)?.changed_by;
    await sendProposalPillarApprovedEmail({
      ...context.base,
      recipient: context.approver,
      actor: pillarLead ? { name: pillarLead.name } : undefined,
    });
  });
  return result;
}

export async function approveProposal(actor: Actor, proposal_id: number) {
  const result = await applyTransition("approve", actor, proposal_id);
  notify("proposal approved", async () => {
    const context = await loadNotificationContext(proposal_id);
    if (!context) return;
    await sendProposalApprovedEmail({
      ...context.base,
      recipient: context.base.requestor,
      cc: context.pillarLead ?? undefined,
    });
  });
  return result;
}

export async function rejectProposal(actor: Actor, proposal_id: number, comment: string | null) {
  const result = await applyTransition("reject", actor, proposal_id, comment);
  notify("proposal rejected", async () => {
    const context = await loadNotificationContext(proposal_id);
    if (!context) return;
    const rejecter = result.status_history.at(-1)?.changed_by;
    await sendProposalRejectedEmail({
      ...context.base,
      recipient: context.base.requestor,
      actor: rejecter ? { name: rejecter.name } : undefined,
      comment: result.rejection_reason,
    });
  });
  return result;
}
