import express from "express";
import { validate } from "../middlewares/validateRequest.js";
import { loginSchema, registerSchema } from "../validations/loginSchemas.js";
import { login, register } from "../controllers/authController.js";
// import { loginRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/login", /*loginRateLimiter,*/ validate(loginSchema), login);
router.post("/register", validate(registerSchema), register);

export default router;
