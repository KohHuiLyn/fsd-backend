import { Router } from "express";
import * as reminderTX from "../db/tx.js"
import { validate, validateParams } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import * as schema from "../schemas/reminders.schema.js";

/**
 * Express router for reminder resources.
 *
 * All routes are mounted under `/reminder` in `server.js`. For user-facing
 * operations an authenticated user is required (see `requireAuth`), while
 * the scheduler-only endpoint `/v1/reminders/due` is intentionally left
 * unauthenticated and can be protected via an internal key if needed.
 *
 * Validation is handled via Zod schemas in `schemas/reminders.schema.js`,
 * and database access is delegated to the transactional helpers in `db/tx.js`.
 */
const router = Router();

// Create a new reminder for the authenticated user.
// router.post ("/v1/reminder", requireAuth, validate(schema.createReminderSchema), async(req, res, next) => {
router.post ("/v1/reminder/create", requireAuth, validate(schema.createReminderSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const reminderID = await reminderTX.createReminder({
        ...req.validated, 
        userID,
      });

      return res.status(201).json({ reminderID });
    } catch (e) {
      next(e)
    }
});

// Get a single reminder by ID, enforcing that it belongs to the current user.
router.get ("/v1/reminder/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const client = await reminderTX.getReminderByID({
        userID, 
        id,
      });

      if (!client) return res.status(404).json({ error: "NotFound" });
      return res.status(201).json({ client });
    } catch (e) {
      next(e)
    }
});

// List all reminders for the authenticated user.
router.get ("/v1/reminders", requireAuth, async(req, res, next) => {
  try {
      const userID = await req.user?.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const clients = await reminderTX.getRemindersByUserID({
        userID,
      });

      if (!clients || clients.length === 0) return res.status(404).json({ error: "NotFound" });
      return res.status(201).json({ clients });
    } catch (e) {
      next(e)
    }
});

// Scheduler-only endpoint: Get reminders due soon within a time window.
router.get("/v1/reminders/due", async (req, res, next) => {
  try {
      const raw = req.query.windowSec;
      const windowSec = Number.isFinite(+raw) && +raw > 0 ? +raw : 60; // default 60s

      console.log("➡️ /reminders/due windowSec:", windowSec);

    // // Optional internal key to protect this route
    // const key = req.header("x-internal-key");
    // if (!key || key !== process.env.INTERNAL_SCHEDULER_KEY) {
    //   return res.status(403).json({ error: "Forbidden", message: "Missing or invalid internal key" });
    // }

    const reminders = await reminderTX.getRemindersDueSoon({ windowSec });

    return res.status(200).json({ reminders });
  } catch (e) {
    next(e);
  }
});

// Partially update a reminder's fields for the authenticated user.
router.put ("/v1/reminder/:id", requireAuth, validateParams(schema.paramID), validate(schema.updateReminderSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const client = await reminderTX.updateReminder({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ client });
    } catch (e) {
      next(e)
    }
});

// Delete a reminder belonging to the authenticated user.
router.delete ("/v1/reminder/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const reminderIDRes = await reminderTX.deleteReminder({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ reminderIDRes });
    } catch (e) {
      next(e)
    }
});

export default router;
