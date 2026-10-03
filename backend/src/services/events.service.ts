import prisma from "../prisma/client";

// Get all events
export const getAllEvents = async () => {
  return prisma.user.findMany();
};

// Get event by ID
export const getEventById = async (event_id: number) => {
  return prisma.event.findUnique({
    where: { event_id },
  });
};

// Create new event
export const createEvent = async (data: {
  event_name: string;
  start_at: Date;
  end_at?: Date | null;
  pillar?: string;
  proposal_id?: number | null;
  admin_id: number;
}) => {
  // TODO(clash-detection): check for overlapping events before creating
  return prisma.event.create({
    data: {
      event_name: data.event_name,
      start_at: data.start_at,
      end_at: data.end_at,
      pillar: data.pillar,
      proposal_id: data.proposal_id,
      admin_id: data.admin_id,
    },
  });
};

// Update event
export const updateEvent = async (
  event_id: number,
  data: {
    event_name?: string;
    start_at?: Date;
    end_at?: Date | null;
    pillar?: string;
    proposal_id?: number | null;
    admin_id?: number;
  }
) => {
  // TODO(clash-detection): re-check overlaps when start_at/end_at change
  return prisma.event.update({
    where: { event_id },
    data,
  });
};

// Delete event
export const deleteEvent = async (event_id: number) => {
  return prisma.event.delete({
    where: { event_id },
  });
};
