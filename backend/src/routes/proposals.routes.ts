import { Router } from "express";
import prisma from "../prisma/client";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authRoles";
import { NotImplemented } from "../middleware/errorHandler";
import {
  getAllProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
} from "../services/proposals.service"; 

const router = Router();

// TODO(proposals-api): remove this guard once the handlers below are reviewed and
// the workflow transitions are implemented. Until then every /proposals call is a 501.
router.use((req, res, next) => next(NotImplemented("proposals-api")));

// GET /proposals
router.get("/", async (req, res) => {
    console.log("GET /proposals called");
    try {
        const proposals = await getAllProposals(); 
        res.json(proposals);
    } catch (error: any) {
    console.error("Error in getAllProposals:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /proposals/:id
router.get("/:id", async (req, res) => {
    console.log("GET /proposals/:id called");

    try {
        const proposal_id = Number(req.params.id);
        // TODO(validation-error-handler): replace with real request validation
        if (isNaN(proposal_id)) {
          return res.status(400).json({ message: "Invalid id" });
        }
        const proposal = await getProposalById(proposal_id); 

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        res.status(200).json(proposal);
    } catch (error: any) {
        console.error("Error in getProposalById: ", error);
        res.status(500).json({ message: error.message });
    }
});

// POST /proposals
router.post("/", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
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
          where: { user_id: Number(requestor_id) },
        });

        if (!requestor) {
          return res.status(400).json({
            message: `Requestor with ID ${requestor_id} does not exist.`,
          });
        }
        
        if (approver_id) {
            const approver = await prisma.user.findUnique({
              where: { user_id: Number(approver_id) },
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
            requestor_id: Number(requestor_id),
            approver_id: approver_id ? Number(approver_id) : null,
        });

        console.log("Created proposal: ", newProposal);
        res.status(201).json(newProposal);
    } catch (error: any) {
        console.error("Error in createProposal:", error);
        res.status(500).json({ message: error.message });
    }
});

// PUT /proposals/:id
router.put("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
    console.log("PUT /proposals/:id called");
    try {
        const proposal_id = Number(req.params.id);
        // TODO(validation-error-handler): replace with real request validation
        if (isNaN(proposal_id)) {
          return res.status(400).json({ message: "Invalid id" });
        }

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
        res.status(200).json(updatedProposal);
    } catch (error: any) {
        console.error("Error in updateProposal: ", error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE /proposals/:id
router.delete("/:id", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
    console.log("DELETE /proposals/:id called");

    try {
        const proposal_id = Number(req.params.id);
        // TODO(validation-error-handler): replace with real request validation
        if (isNaN(proposal_id)) {
          return res.status(400).json({ message: "Invalid id" });
        }
        const deletedProposal = await deleteProposal(proposal_id);

        if (!deletedProposal) {
             return res.status(404).json({ message: "Proposal not found" });
        }

        console.log("Deleted Proposal: ", deletedProposal);
        res.status(200).json(deletedProposal);
    } catch (error: any) {
        console.error("Error in deleteProposal: ", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;