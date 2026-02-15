import express from "express";
import cors from "cors";
import tokenRoutes from "./routes/token.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, 
  })
);
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Server running ");
});

app.use("/api", tokenRoutes);

export default app;
