import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import userRouter from "./routes/user";
import eventRouter from "./routes/event";
import authRouter from "./routes/auth";

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/event", eventRouter);

app.get("/", (req, res) => {
  res.send("API is running!");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
