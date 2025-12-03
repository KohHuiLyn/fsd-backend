import express from "express";
import { getUserByEmail, createUser, getUserById } from "../controllers/userControllers.js";
import { validate } from "../middlewares/validateRequest.js";
import { createUserSchema } from "../validations/userSchemas.js";
import verifyInternal from "../middlewares/verifyInternal.js";

const router = express.Router();

// Internal: only login-service can call
router.post("/", verifyInternal, validate(createUserSchema), createUser);
router.get("/", verifyInternal, getUserByEmail); // expects ?email=

// Public: accessible to frontend
router.get("/:id", getUserById);

export default router;
