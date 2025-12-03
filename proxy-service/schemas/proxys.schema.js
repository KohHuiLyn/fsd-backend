import { z } from "zod";

const uuid = z.coerce.string().uuid();

// CREATE (POST /profiles)
export const createSchema = z.object({
  name: z.string().trim().min(1, "A name must be provided!"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  phoneNumber: z.string() // Format: + | country code | digits (10–15 digits)
    .trim()
    .optional(),
});

export const updateSchema = z.object({
  name: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  phoneNumber: z.string() // Format: + | country code | digits (10–15 digits)
    .trim()
    .optional(),
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

export const searchSchema = z.object({
  searchValue: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
  offset: z.coerce.number().int().min(0).default(0)
}).refine(
  // obj => Object.keys(obj).length > 0, 
  // { message: "Provide at least one field to search",}
  d => d.searchValue,
  { message: "No search was entered" }
);

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
