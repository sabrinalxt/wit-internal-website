import { Router } from "express";
import { NotImplemented } from "../middleware/errorHandler";

const router = Router();

// TODO(templates-api): CRUD for templates (Admin-managed, readable by signed-in users)
router.use((req, res, next) => next(NotImplemented("templates-api")));

export default router;
