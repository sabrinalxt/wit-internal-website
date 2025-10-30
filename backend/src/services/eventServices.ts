import prisma from "../prisma/client";

// Get all events
export const getAllEvents = async () => {
  return prisma.user.findMany();
};

// Get event by ID
export const getEventById = async (event_id: bigint) => {
  return prisma.event.findUnique({
    where: { event_id },
  });
};

// Create new event
export const createEvent = async (data: {
  event_name: string;
  event_date?: Date;
  pillar?: string;
  proposal_id: bigint;
  admin_id: bigint;
}) => {
  return prisma.event.create({
    data: {
      event_name: data.event_name,
      event_date: data.event_date,
      pillar: data.pillar,
      proposal_id: data.proposal_id,
      admin_id: data.admin_id,
    },
  });
};

// Update event
export const updateEvent = async (
  event_id: bigint,
  data: {
    event_name?: string;
    event_date?: Date;
    pillar?: string;
    proposal_id?: bigint;
    admin_id?: bigint;
  }
) => {
  return prisma.event.update({
    where: { event_id },
    data,
  });
};

// Delete event
export const deleteEvent = async (event_id: bigint) => {
  return prisma.event.delete({
    where: { event_id },
  });
};
