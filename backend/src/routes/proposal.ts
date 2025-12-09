import { Router } from "express";
import prisma from "../prisma/client";
import {
  getAllProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
} from "../services/proposalServices"; 

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
        const proposals = await getAllProposals(); 
        res.json(serializeBigInt(proposals));
    } catch (error: any) {
    console.error("Error in getAllProposals:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /proposals/:id
router.get("/:id", async (req, res) => {
    console.log("GET /proposals/:id called");

    try {
        const proposal_id = BigInt(req.params.id); // Convert from string to bigint
        const proposal = await getProposalById(proposal_id); 

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        res.status(200).json(serializeBigInt(proposal));
    } catch (error: any) {
        console.error("Error in getProposalById: ", error);
        res.status(500).json({ message: error.message });
    }
});

// POST /proposals
router.post("/", async (req, res) => {
    console.log("POST /proposals called");
    try {
        const {
            proposal_name,
            proposal_type,
            proposal_status,
            date_submitted,
            date_reviewed,
            requestor_id,
            approver_id,
        } = req.body;

        const requestor = await prisma.user.findUnique({
          where: { user_id: BigInt(requestor_id) },
        });

        if (!requestor) {
          return res.status(400).json({
            message: `Requestor with ID ${requestor_id} does not exist.`,
          });
        }
        
        if (approver_id) {
            const approver = await prisma.user.findUnique({
              where: { user_id: BigInt(approver_id) },
            });

            if (!approver) {
              return res.status(400).json({
                message: `Approver with ID ${approver_id} does not exist.`,
              });
            }
        }


        const newProposal = await createProposal({ 
            proposal_name,
            proposal_type,
            proposal_status,
            date_submitted: date_submitted ? new Date(date_submitted) : new Date(), 
            date_reviewed: date_reviewed ? new Date(date_reviewed) : new Date(), 
            requestor_id: BigInt(requestor_id),
            approver_id: approver_id ? BigInt(approver_id) : null,
        });

        console.log("Created proposal: ", newProposal);
        res.status(201).json(serializeBigInt(newProposal));
    } catch (error: any) {
        console.error("Error in createProposal:", error);
        res.status(500).json({ message: error.message });
    }
});

// PUT /proposals/:id
router.put("/:id", async (req, res) => {
    console.log("PUT /proposals/:id called");
    try {
        const proposal_id = BigInt(req.params.id);

        const existingProposal = await prisma.proposal.findUnique({
          where: { proposal_id },
        });

        if (!existingProposal) {
          return res.status(404).json({ message: "Proposal not found" });
        }

        const {
            proposal_name,
            proposal_type,
            proposal_status,
            date_submitted,
            date_reviewed,
            requestor_id,
            approver_id,
        } = req.body;

        const updatedProposal = await updateProposal(proposal_id, { 
            proposal_name,
            proposal_type,
            proposal_status,
            date_submitted,
            date_reviewed,
            requestor_id,
            approver_id,
        });

        console.log("Updated proposal: ", updatedProposal);
        res.status(200).json(serializeBigInt(updatedProposal));
    } catch (error: any) {
        console.error("Error in updateProposal: ", error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE /proposals/:id
router.delete("/:id", async (req, res) => {
    console.log("DELETE /proposals/:id called");

    try {
        const proposal_id = BigInt(req.params.id);
        const deletedProposal = await deleteProposal(proposal_id);

        if (!deletedProposal) {
             return res.status(404).json({ message: "Proposal not found" });
        }

        console.log("Deleted Proposal: ", deletedProposal);
        res.status(200).json(serializeBigInt(deletedProposal));
    } catch (error: any) {
        console.error("Error in deleteProposal: ", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;