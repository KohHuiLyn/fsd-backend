import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
  phoneNumber: z
    .string()
    .regex(/^\+?\d{8,15}$/, "Invalid phone number format"),
  passwordHash: z
    .string()
    .min(20, "Password hash appears invalid"),
  role: z.enum(["gardener", "admin"], {
    errorMap: () => ({ message: "Invalid role type" }),
  }),
});
