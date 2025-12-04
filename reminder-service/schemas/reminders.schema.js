import { z } from "zod";

const uuid = z.string().uuid();
const phoneOptional = z
  .preprocess(
    (v) => {
      // treat null/undefined/"" as undefined (i.e., optional)
      if (v === undefined || v === null) return undefined;
      const s = String(v).trim();
      return s === "" ? undefined : s;
    },
    z
      .string()
      .transform((val) => val.replace(/[\s-]+/g, ""))                 // strip spaces/dashes
      .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val), {              // E.164-ish
        message: "Invalid phone number.",
      })
  )
  .optional();

// CREATE (POST /profiles)
export const createReminderSchema = z.object({
  name: z.string().trim().default("Reminder"),
  notes: z.string(),
  isActive: z.boolean(),
  dueAt: z.coerce.date(),
  dueDay: z.array(z.number()).min(1).max(7).default([1, 2, 3, 4, 5, 6, 7]),
  isProxy: z.boolean(),
  proxy: z.string() // Format: + | country code | digits (10–15 digits)
    .trim()
    .transform((val) => val.replace(/[\s-]+/g, '')) // Space and - so that +65 8293 8737 or 92-3749-93872 works?
    .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val), {
      message: "Invalid phone number."
    }),
});

export const updateReminderSchema = z.object({
  name: z.string().trim().default("Reminder").optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  dueAt: z.coerce.date().optional(),
  dueDay: z.array(z.number()).min(1).max(7).default([1, 2, 3, 4, 5, 6, 7]).optional(),
  isProxy: z.boolean().optional(),
  proxy: z.string() // Format: + | country code | digits (10–15 digits)
    .trim()
    .transform((val) => val.replace(/[\s-]+/g, '')) // Space and - so that +65 8293 8737 or 92-3749-93872 works?
    .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val), {
      message: "Invalid phone number."
    }).optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});

// PARAMS (/clients/?agent_id=)
export const paramID = z.object({
  id: z.coerce.string().uuid(),
});

// export const pageAllClientSchema = z.object({
//   // page: z.coerce.number().int().min(1).default(1),
//   limit: z.coerce.number().int().min(1).max(40).default(20),
//   // include_deleted: z.coerce.boolean().default(false),
//   offset: z.coerce.number().int().min(0).default(0)
// }).transform((data) => ({
//   ...data,
//   offset: data.offset ?? (data.limit - 20), // computed fallback
// }));

// export const searchSchema = z.object({
//   searchValue: z.string().trim().min(1).optional(),
//   limit: z.coerce.number().int().min(1).max(40).default(20),
//   offset: z.coerce.number().int().min(0).default(0)
// }).refine(
//   // obj => Object.keys(obj).length > 0, 
//   // { message: "Provide at least one field to search",}
//   d => d.searchValue,
//   { message: "No search was entered" }
// );

// export const getschema = z.object({
//   firstName: z.string().trim().min(1).optional(),
//   lastName: z.string().trim().min(1).optional(),
//   email: z.string().trim().email().transform(v => v.toLowerCase()).optional(),
// }).refine(
//   // obj => Object.keys(obj).length > 0, 
//   // { message: "Provide at least one field to search",}
//   d => d.firstName || d.lastName || d.email,
//   { message: "Provide at least one field to search" }
// );

// (Optional) LIST QUERY (/agents?page=&limit=&include_deleted=)
// export const pageAllClientSchema = z.object({
//   // page: z.coerce.number().int().min(1).default(1),
//   limit: z.coerce.number().int().min(1).max(40).default(20),
//   // include_deleted: z.coerce.boolean().default(false),
//   offset: z.coerce.number().int().min(0).default(0)
// }).transform((data) => ({
//   ...data,
//   offset: data.offset ?? (data.limit - 20), // computed fallback
// }));
