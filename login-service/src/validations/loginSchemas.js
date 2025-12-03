import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "Invalid phone number format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  role: z.enum(["gardener", "admin"], {
    errorMap: () => ({ message: "Invalid role type" }),
  }),
});
