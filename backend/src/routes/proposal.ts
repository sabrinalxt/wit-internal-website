import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

// GET /proposals
router.get("/", async (req, res) => {
    console.log("GET /proposals called");
    try {
        const proposals = await prisma.proposal.findMany();
        res.json(serializeBigInt(proposals));
    } catch (error: any) {
    console.error("Error in getAllProposals:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /proposals
router.post("/", async (req, res) => {
    console.log("POST /proposals called");
  try {
    const { proposal_name, proposal_type, proposal_status, date_submitted, date_reviewed, requestor_id, approver_id } = req.body;
    const newProposal = await prisma.proposal.create({
      data: { proposal_name, proposal_type, proposal_status, date_submitted, date_reviewed, requestor_id, approver_id },
    });
    console.log("Created proposal: ", newProposal));
};