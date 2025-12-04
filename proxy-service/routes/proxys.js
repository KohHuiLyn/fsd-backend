import { Router } from "express";
import * as proxyTX from "../db/tx.js"
import { validate, validateParams, validateQuery } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import * as schema from "../schemas/proxys.schema.js";

/**
 * Express router for proxy resources.
 *
 * All routes are mounted under `/proxy` in `server.js` and assume an
 * authenticated user (see `requireAuth` middleware). Validation is handled
 * via Zod schemas in `schemas/proxys.schema.js`, and database access is
 * delegated to the transaction helpers in `db/tx.js`.
 */
const router = Router();

// Create a new proxy for the authenticated user.
router.post ("/v1/proxy/create", requireAuth,  validate(schema.createSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxyID = await proxyTX.createProxy({
        ...req.validated, 
        userID,
      });

      return res.status(201).json({ proxyID });
    } catch (e) {
      next(e)
    }
});

// Get a single proxy by ID, enforcing that it belongs to the current user.
router.get ("/v1/proxy/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxy = await proxyTX.getProxyByID({
        userID, 
        id,
      });

      // if (!proxy) return res.status(404).json({ error: "NotFound" });
      return res.status(201).json({ proxy });
    } catch (e) {
      next(e)
    }
});

// List all proxies for the authenticated user.
router.get ("/v1/proxys", requireAuth, async(req, res, next) => {
  try {
      const userID = await req.user?.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxys = await proxyTX.getProxysByUserID({
        userID,
      });

      // if (!proxys || proxys.length === 0) return res.status(404).json({ error: "NotFound" });
      return res.status(201).json({ proxys });
    } catch (e) {
      next(e)
    }
});

// Full-text style search over a user's proxies with pagination.
router.get ("/search", requireAuth, validateQuery(schema.searchSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      console.log(userID);

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxys = await proxyTX.searchProxys({
        ...req.validatedQuery, 
        userID,
      });

      // if (!proxys || proxys.length === 0) return res.status(404).json({ error: "NotFound" });
      return res.status(200).json({ proxys });
    } catch (e) {
      next(e)
    }
});

// Partially update a proxy's fields for the authenticated user.
router.put ("/v1/proxy/:id", requireAuth, validateParams(schema.paramID), validate(schema.updateSchema), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxy = await proxyTX.updateProxys({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ proxy });
    } catch (e) {
      next(e)
    }
});

// Delete a proxy belonging to the authenticated user.
router.delete ("/v1/proxy/:id", requireAuth, validateParams(schema.paramID), async(req, res, next) => {
  try {
      const userID = await req.user?.id;
      const id = await req.validatedParams.id;

      if (!userID) {
        return res.status(403).json({ error: "Forbidden", message: "Missing userID" });
      }

      const proxyID = await proxyTX.deleteProxy({
        ...req.validated, 
        userID,
        id
      });

      return res.status(201).json({ proxyID });
    } catch (e) {
      next(e)
    }
});

export default router;
