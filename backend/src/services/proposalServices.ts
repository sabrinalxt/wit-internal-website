import prisma from "../prisma/client";

// Get all proposals
export const getAllProposals = async () => {
  return prisma.proposal.findMany();
};

// Get proposal by ID
export const getProposalById = async (proposal_id: number) => {
  return prisma.proposal.findUnique({
    where: { proposal_id },
  });
};

// Create new proposal
export const createProposal = async (data: {
  proposal_name: string;
  proposal_type: 'IPA' | 'FA';
  proposal_status: string;
  date_submitted?: Date;
  date_reviewed?: Date;
  requestor_id: number;
  approver_id?: number | null; // approver_id is nullable in the DB
}) => {
  return prisma.proposal.create({
    data: {
      proposal_name: data.proposal_name,
      proposal_type: data.proposal_type,
      proposal_status: data.proposal_status,
      date_submitted: data.date_submitted,
      date_reviewed: data.date_reviewed,
      requestor_id: data.requestor_id,
      approver_id: data.approver_id,
    },
  });
};

// Update proposal
export const updateProposal = async (
  proposal_id: number,
  data: {
    proposal_name?: string;
    proposal_type?: 'IPA' | 'FA';
    proposal_status?: string;
    date_submitted?: Date;
    date_reviewed?: Date;
    requestor_id?: number;
    approver_id?: number | null;
  }
) => {
  return prisma.proposal.update({
    where: { proposal_id },
    data,
  });
};

// Delete proposal
export const deleteProposal = async (proposal_id: number) => {
  return prisma.proposal.delete({
    where: { proposal_id },
  });
};