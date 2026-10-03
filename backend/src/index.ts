import { env } from "./config/env";
import express from "express";
import cors from "cors";
import userRouter from "./routes/users.routes";
import eventRouter from "./routes/events.routes";
import authRouter from "./routes/auth.routes";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/event", eventRouter);

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
