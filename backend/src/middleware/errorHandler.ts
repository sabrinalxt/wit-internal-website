import { NextFunction, Request, Response } from "express";

// Throw (or pass to next()) an AppError to send a specific status and message.
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Helper for stub endpoints: NotImplemented("proposals-api")
export function NotImplemented(task: string): AppError {
  return new AppError(501, `Not implemented yet (${task})`);
}

// Unmatched routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. Every error response has one shape: { error: { message } }
// TODO(validation-error-handler): map validation errors (e.g. zod) to 400 here.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message } });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: { message: "Internal server error" } });
}
