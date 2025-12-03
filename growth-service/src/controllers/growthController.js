import * as svc from "../services/growthService.js";

export async function createGrowthRecord(req, res) {
  try {
    const { userPlantId, imageUrl, diagnosisResult, confidence } = req.body;
    if (!userPlantId || !imageUrl || !diagnosisResult || confidence == null) {
      return res.status(400).json({
        message: "userPlantId, imageUrl, diagnosisResult, confidence required",
      });
    }
    const rec = await svc.createRecord({
      userPlantId,
      imageUrl,
      diagnosisResult,
      confidence: Number(confidence),
    });
    res.status(201).json(rec);
  } catch (e) {
    console.error("createGrowthRecord", e);
    res.status(500).json({ message: "Failed to create record" });
  }
}

export async function listGrowthRecordsByPlant(req, res) {
  try {
    const recs = await svc.listByPlant(req.params.userPlantId);
    res.json(recs);
  } catch (e) {
    console.error("listGrowthRecordsByPlant", e);
    res.status(500).json({ message: "Failed to fetch records" });
  }
}

export async function getGrowthRecordById(req, res) {
  try {
    const rec = await svc.getById(req.params.recordId);
    if (!rec) return res.status(404).json({ message: "Not found" });
    res.json(rec);
  } catch (e) {
    console.error("getGrowthRecordById", e);
    res.status(500).json({ message: "Failed to fetch record" });
  }
}

// DELETE /growth/:id
export async function deleteGrowthRecord(req, res) {
  try {
    const { id } = req.params;
    await svc.deleteRecord(id);
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (e) {
    console.error("deleteGrowthRecord", e);
    res.status(500).json({ message: "Failed to delete record" });
  }
}

// PUT /growth/:id/notes
export async function updateGrowthNotes(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) return res.status(400).json({ message: "Notes are required" });

    const record = await svc.updateNotes(id, notes);
    res.status(200).json(record);
  } catch (e) {
    console.error("updateGrowthNotes", e);
    res.status(500).json({ message: "Failed to update notes" });
  }
}

// GET /growth/latest/:userPlantId
export async function getLatestGrowthRecord(req, res) {
  try {
    const { userPlantId } = req.params;
    const record = await svc.getLatestByPlant(userPlantId);
    if (!record) return res.status(404).json({ message: "No records found" });
    res.json(record);
  } catch (e) {
    console.error("getLatestGrowthRecord", e);
    res.status(500).json({ message: "Failed to fetch latest record" });
  }
}
