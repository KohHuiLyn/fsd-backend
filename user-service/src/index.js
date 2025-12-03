import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

// (before Prisma connects)
// if (process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_HOST) {
//   process.env.DATABASE_URL = `postgresql://${process.env.DB_USERNAME}:${encodeURIComponent(
//     process.env.DB_PASSWORD
//   )}@${process.env.DB_HOST}:5432/plantpal?schema=public`;
//   console.log("-- DATABASE_URL configured dynamically from Secrets Manager --");
// }

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("User Service Running"));

app.use("/users", userRoutes);
app.use(errorHandler);

// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`User-service running on port ${PORT}`));
