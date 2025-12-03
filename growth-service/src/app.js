import express from "express";
import dotenv from "dotenv";
import growthRoutes from "./routes/growthRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

// health
app.get("/", (_, res) => res.json({ ok: true, service: "growth-service" }));

// routes
app.use("/growth", growthRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`🌿 growth-service listening on ${PORT}`));
