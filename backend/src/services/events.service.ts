import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";

// Every event response uses this shape (what the calendar page expects).
// Only id and name fields are selected from the admin, never password_hash.
const eventInclude = {
  proposal: { select: { proposal_id: true, proposal_name: true, proposal_type: true } },
  admin: { select: { first_name: true, last_name: true } },
} as const;

const MAX_NAME_LENGTH = 255;
const MAX_PILLAR_LENGTH = 100; // matches the schema column

// TODO(validation-error-handler): replace the checks below with real request validation
function parseDate(value: unknown, field: string): Date {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, `${field} must be an ISO 8601 date string`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(400, `${field} is not a valid date`);
  }
  return date;
}

function parseName(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "event_name is required");
  }
  const name = value.trim();
  if (name.length > MAX_NAME_LENGTH) {
    throw new AppError(400, `event_name must be at most ${MAX_NAME_LENGTH} characters`);
  }
  return name;
}

function parsePillar(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new AppError(400, "pillar must be a string");
  }
  if (value.length > MAX_PILLAR_LENGTH) {
    throw new AppError(400, `pillar must be at most ${MAX_PILLAR_LENGTH} characters`);
  }
  return value;
}

async function parseProposalId(value: unknown): Promise<number | null> {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new AppError(400, "proposal_id must be a positive integer");
  }
  const proposal = await prisma.proposal.findUnique({
    where: { proposal_id: value },
    select: { proposal_id: true },
  });
  if (!proposal) {
    throw new AppError(400, `Proposal with ID ${value} does not exist`);
  }
  return value;
}

function checkRange(start_at: Date, end_at: Date | null) {
  if (end_at && end_at < start_at) {
    throw new AppError(400, "end_at must not be before start_at");
  }
}

const isGiven = (value: unknown) => value !== undefined;

// Get all events, optionally limited to a visible range (?from=&to=)
export const getAllEvents = async (query: { from?: unknown; to?: unknown } = {}) => {
  const from = isGiven(query.from) ? parseDate(query.from, "from") : null;
  const to = isGiven(query.to) ? parseDate(query.to, "to") : null;

  // An event is in range if it starts before `to` and ends (or, with no end, starts) at or after `from`
  const where = {
    ...(to && { start_at: { lt: to } }),
    ...(from && {
      OR: [{ end_at: { gte: from } }, { end_at: null, start_at: { gte: from } }],
    }),
  };

  return prisma.event.findMany({
    where,
    orderBy: { start_at: "asc" },
    include: eventInclude,
  });
};

// Get event by ID
export const getEventById = async (event_id: number) => {
  const event = await prisma.event.findUnique({
    where: { event_id },
    include: eventInclude,
  });
  if (!event) {
    throw new AppError(404, "Event not found");
  }
  return event;
};

// Create new event. admin_id is always the authenticated user, never taken from the body.
export const createEvent = async (admin_id: number, body: Record<string, unknown>) => {
  const event_name = parseName(body.event_name);
  const start_at = parseDate(body.start_at, "start_at");
  const end_at =
    isGiven(body.end_at) && body.end_at !== null ? parseDate(body.end_at, "end_at") : null;
  checkRange(start_at, end_at);
  const pillar = isGiven(body.pillar) ? parsePillar(body.pillar) : null;
  const proposal_id = isGiven(body.proposal_id) ? await parseProposalId(body.proposal_id) : null;

  // TODO(clash-detection): check for overlapping events before creating
  return prisma.event.create({
    data: { event_name, start_at, end_at, pillar, proposal_id, admin_id },
    include: eventInclude,
  });
};

// Update event. Partial body; only whitelisted fields are applied and admin_id can't change.
export const updateEvent = async (event_id: number, body: Record<string, unknown>) => {
  const existing = await prisma.event.findUnique({ where: { event_id } });
  if (!existing) {
    throw new AppError(404, "Event not found");
  }

  const data: {
    event_name?: string;
    start_at?: Date;
    end_at?: Date | null;
    pillar?: string | null;
    proposal_id?: number | null;
  } = {};

  if (isGiven(body.event_name)) data.event_name = parseName(body.event_name);
  if (isGiven(body.start_at)) data.start_at = parseDate(body.start_at, "start_at");
  if (isGiven(body.end_at)) {
    data.end_at = body.end_at === null ? null : parseDate(body.end_at, "end_at");
  }
  if (isGiven(body.pillar)) data.pillar = parsePillar(body.pillar);
  if (isGiven(body.proposal_id)) data.proposal_id = await parseProposalId(body.proposal_id);

  if (Object.keys(data).length === 0) {
    throw new AppError(400, "No updatable fields provided");
  }

  checkRange(
    data.start_at ?? existing.start_at,
    data.end_at !== undefined ? data.end_at : existing.end_at,
  );

  // TODO(clash-detection): re-check overlaps when start_at/end_at change
  return prisma.event.update({
    where: { event_id },
    data,
    include: eventInclude,
  });
};

// Delete event
export const deleteEvent = async (event_id: number) => {
  const existing = await prisma.event.findUnique({ where: { event_id } });
  if (!existing) {
    throw new AppError(404, "Event not found");
  }
  await prisma.event.delete({ where: { event_id } });
};
