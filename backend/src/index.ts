import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import userRouter from "./routes/user";

const app = express();
app.use(express.json());

// Routes
app.use("/users", userRouter);

app.post("/test", (req, res) => {
  res.send("Hello world");
});

app.get("/", (req, res) => {
  res.send("API is running!");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
