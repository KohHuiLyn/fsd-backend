import prisma from "../models/prisma.js";

export async function createRecord({
  userPlantId,
  imageUrl,
  diagnosisResult,
  confidence,
}) {
  return prisma.growthRecord.create({
    data: { userPlantId, imageUrl, diagnosisResult, confidence },
  });
}

export async function listByPlant(userPlantId) {
  return prisma.growthRecord.findMany({
    where: { userPlantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id) {
  return prisma.growthRecord.findUnique({ where: { id } });
}

// Delete a growth record
export async function deleteRecord(id) {
  return prisma.growthRecord.delete({
    where: { id },
  });
}

// Update notes for a record
export async function updateNotes(id, notes) {
  return prisma.growthRecord.update({
    where: { id },
    data: { notes },
  });
}

// Get the latest record for a specific plant
export async function getLatestByPlant(userPlantId) {
  return prisma.growthRecord.findFirst({
    where: { userPlantId },
    orderBy: { createdAt: "desc" },
  });
}
