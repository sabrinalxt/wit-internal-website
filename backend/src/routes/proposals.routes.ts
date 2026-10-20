import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/authMiddleware";
import { AppError } from "../middleware/errorHandler";
import {
  Actor,
  approveProposal,
  createProposal,
  deleteProposal,
  getProposal,
  listProposals,
  listReviewers,
  pillarApproveProposal,
  rejectProposal,
  submitProposal,
  updateProposal,
} from "../services/proposals.service";

const router = Router();

// Express 5 forwards rejected promises from async handlers to the error handler,
// so handlers here do not need try/catch.
router.use(authenticateToken);

// The caller always comes from the verified token (the JWT stores userId as a string)
function getActor(req: AuthRequest): Actor {
  const userId = Number(req.user?.userId);
  if (!req.user || !Number.isInteger(userId)) {
    throw new AppError(403, "Invalid token payload");
  }
  return { userId, roles: req.user.roles };
}

// TODO(validation-error-handler): replace with real request validation
function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid id");
  }
  return id;
}

// GET /proposals
router.get("/", async (req: AuthRequest, res) => {
  res.json(await listProposals(getActor(req), req.query));
});

// GET /proposals/reviewers (must stay above /:id)
router.get("/reviewers", async (req: AuthRequest, res) => {
  res.json(await listReviewers(getActor(req)));
});

// GET /proposals/:id
router.get("/:id", async (req: AuthRequest, res) => {
  res.json(await getProposal(getActor(req), parseId(req.params.id)));
});

// POST /proposals
router.post("/", async (req: AuthRequest, res) => {
  res.status(201).json(await createProposal(getActor(req), req.body ?? {}));
});

// PUT /proposals/:id
router.put("/:id", async (req: AuthRequest, res) => {
  res.json(await updateProposal(getActor(req), parseId(req.params.id), req.body ?? {}));
});

// DELETE /proposals/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  await deleteProposal(getActor(req), parseId(req.params.id));
  res.status(204).send();
});

// POST /proposals/:id/submit
router.post("/:id/submit", async (req: AuthRequest, res) => {
  res.json(await submitProposal(getActor(req), parseId(req.params.id)));
});

// POST /proposals/:id/pillar-approve
router.post("/:id/pillar-approve", async (req: AuthRequest, res) => {
  res.json(await pillarApproveProposal(getActor(req), parseId(req.params.id)));
});

// POST /proposals/:id/approve
router.post("/:id/approve", async (req: AuthRequest, res) => {
  res.json(await approveProposal(getActor(req), parseId(req.params.id)));
});

// POST /proposals/:id/reject  body: { comment }
router.post("/:id/reject", async (req: AuthRequest, res) => {
  const comment = typeof req.body?.comment === "string" ? req.body.comment : null;
  res.json(await rejectProposal(getActor(req), parseId(req.params.id), comment));
});

export default router;
