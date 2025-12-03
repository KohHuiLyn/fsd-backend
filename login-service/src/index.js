import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import axios from "axios";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { httpRequestDuration, httpRequestCount, getMetrics } from "./metrics.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());

// Metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ route: req.path, method: req.method });

  res.on("finish", () => {
    const status = res.statusCode;
    httpRequestCount.inc({ route: req.path, method: req.method, status });
    end({ status });
  });

  next();
});

app.get("/", (req, res) => res.send("Login Service Running"));

app.get("/metrics", getMetrics);

const openapiSpec = YAML.load("./openapi.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Existing /health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "login-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// New /readiness endpoint (for ECS/K8s)
app.get("/readiness", async (req, res) => {
  const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

  try {
    const response = await axios.get(`${USER_SERVICE_URL}/health`, { timeout: 1000 });
    if (response.status === 200) {
      return res.status(200).json({ status: "ready", dependencies: "user-service: healthy" });
    }
    return res.status(503).json({ status: "degraded", dependencies: "user-service: unhealthy" });
  } catch (err) {
    console.error("Readiness check failed:", err.message);
    return res.status(503).json({ status: "unready", dependencies: "user-service: unreachable" });
  }
});

app.use("/auth", authRoutes);

app.use(errorHandler);

// const PORT = process.env.PORT || 3000;
const PORT = 3002;
app.listen(PORT, () => console.log(`Login-service running on port ${PORT}`));
