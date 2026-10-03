import { env } from "./config/env";
import express from "express";
import cors from "cors";
import userRouter from "./routes/users.routes";
import eventRouter from "./routes/events.routes";
import authRouter from "./routes/auth.routes";
import proposalRouter from "./routes/proposals.routes";
import templateRouter from "./routes/templates.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
  res.send("OK");
});
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/events", eventRouter);
app.use("/proposals", proposalRouter);
app.use("/templates", templateRouter);

app.get("/", (req, res) => {
  res.send("API is running!");
});

// Must come after all routes
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
