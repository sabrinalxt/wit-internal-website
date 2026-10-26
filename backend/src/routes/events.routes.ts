import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authRoles";
import { AppError } from "../middleware/errorHandler";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/events.service";

const router = Router();

// Express 5 forwards rejected promises from async handlers to the error handler,
// so handlers here do not need try/catch.
// Any logged-in user can read events (the calendar is for everyone); writes are Admin only.
router.use(authenticateToken);

// The caller always comes from the verified token (the JWT stores userId as a string)
function getUserId(req: AuthRequest): number {
  const userId = Number(req.user?.userId);
  if (!req.user || !Number.isInteger(userId)) {
    throw new AppError(403, "Invalid token payload");
  }
  return userId;
}

// TODO(validation-error-handler): replace with real request validation
function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid id");
  }
  return id;
}

// GET /events?from=&to=
router.get("/", async (req, res) => {
  res.json(await getAllEvents(req.query));
});

// GET /events/:id
router.get("/:id", async (req, res) => {
  res.json(await getEventById(parseId(req.params.id)));
});

// POST /events (admin_id in the body is ignored)
router.post("/", authorizeRoles(["Admin"]), async (req: AuthRequest, res) => {
  res.status(201).json(await createEvent(getUserId(req), req.body ?? {}));
});

// PUT /events/:id (admin_id cannot be changed)
router.put("/:id", authorizeRoles(["Admin"]), async (req, res) => {
  res.json(await updateEvent(parseId(req.params.id), req.body ?? {}));
});

// DELETE /events/:id
router.delete("/:id", authorizeRoles(["Admin"]), async (req, res) => {
  await deleteEvent(parseId(req.params.id));
  res.status(204).send();
});

export default router;
