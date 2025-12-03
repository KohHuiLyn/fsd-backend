import express from "express";
import {
  createGrowthRecord,
  listGrowthRecordsByPlant,
  getGrowthRecordById,
  deleteGrowthRecord,
  updateGrowthNotes,
  getLatestGrowthRecord,
} from "../controllers/growthController.js";

const router = express.Router();

// POST /growth
router.post("/", createGrowthRecord);

// GET /growth/plant/:userPlantId
router.get("/plant/:userPlantId", listGrowthRecordsByPlant);

// GET /growth/:recordId
router.get("/:recordId", getGrowthRecordById);

// DELETE /growth/:id
router.delete("/:id", deleteGrowthRecord);

// PUT /growth/:id/notes
router.put("/:id/notes", updateGrowthNotes);

// GET /growth/latest/:userPlantId
router.get("/latest/:userPlantId", getLatestGrowthRecord);

export default router;
