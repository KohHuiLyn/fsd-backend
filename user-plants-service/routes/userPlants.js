import { Router } from "express";
import * as upTX from "../db/tx.js"
import { validate, validateParams, validateQuery } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import * as schema from "../schemas/userPlants.schema.js";
import multer from "multer";

/**
 * Express router for user-plant resources.
 *
 * All routes are mounted under `/userPlant` in `server.js` and assume an
 * authenticated user (see `requireAuth` middleware). Validation is handled
 * via Zod schemas in `schemas/userPlants.schema.js`, and database access is
 * delegated to the transaction helpers in `db/tx.js`.
 */
const router = Router();
const upload = multer();

// Create a new user-plant for the authenticated user, including photo upload.
// router.post ("/v1/userPlant", requireAuth,  upload.single('file'), validate(schema.createUserPlantSchema), async(req, res, next) => {
router.post ("/v1/userPlant/create", requireAuth,  upload.single('file'), validate(schema.createUserPlantSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const file = req.file;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plantID = await upTX.createUserPlant({
        ...req.validated, 
        file,
        userID,
      });

      return res.status(201).json({ plantID });
    } catch (e) {
      next(e)
    }
});

// Get a single user-plant by ID, enforcing that it belongs to the current user.
router.get ("/v1/userPlant/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plant = await upTX.getUserPlantByID({
        userID, 
        id,
      });

      // if (!plant) return res.status(404).json({ error: "NotFound" });
      return res.status(200).json({ plant });
    } catch (e) {
      next(e)
    }
});

// List all user-plants for the authenticated user.
router.get ("/v1/userPlants", requireAuth, async(req, res, next) => {
  try {
      const userID = await req.user?.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plants = await upTX.getUserPlantsByUserID({
        userID,
      });

      // if (!plants || plants.length === 0) return res.status(404).json({ error: "NotFound" });
      return res.status(200).json({ plants });
    } catch (e) {
      next(e)
    }
});



// Search a user's plants by name/notes with pagination.
router.get ("/search", requireAuth, validateQuery(schema.searchSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      console.log(userID);

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plants = await upTX.searchUserPlants({
        ...req.validatedQuery, 
        userID,
      });

      // if (!plants || plants.length === 0) return res.status(404).json({ error: "NotFound" });
      return res.status(200).json({ plants });
    } catch (e) {
      next(e)
    }
});

// Partially update a user-plant's fields for the authenticated user.
router.put ("/v1/userPlant/:id", requireAuth, validateParams(schema.paramID), validate(schema.updateUserPlantSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plant = await upTX.updateUserPlants({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ plant });
    } catch (e) {
      next(e)
    }
});

// Delete a user-plant belonging to the authenticated user.
router.delete ("/v1/userPlant/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const plantID = await upTX.deleteUserPlant({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ plantID });
    } catch (e) {
      next(e)
    }
});

export default router;
