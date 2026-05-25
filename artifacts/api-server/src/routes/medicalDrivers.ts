import { Router } from "express";
import { db, medicalDriversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterMedicalDriverBody,
  GetMedicalDriverParams,
  VerifyMedicalDriverParams,
  VerifyMedicalDriverBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const drivers = await db.select().from(medicalDriversTable).orderBy(medicalDriversTable.createdAt);
  res.json(drivers.map(fmt));
});

router.post("/", async (req, res) => {
  const parsed = RegisterMedicalDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [driver] = await db.insert(medicalDriversTable).values(parsed.data).returning();
  res.status(201).json(fmt(driver));
});

router.get("/:id", async (req, res) => {
  const parsed = GetMedicalDriverParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [driver] = await db.select().from(medicalDriversTable).where(eq(medicalDriversTable.id, parsed.data.id));
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(driver));
});

router.post("/:id/verify", async (req, res) => {
  const paramsParsed = VerifyMedicalDriverParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = VerifyMedicalDriverBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { status, rejectionReason } = bodyParsed.data;
  const [driver] = await db
    .update(medicalDriversTable)
    .set({ verificationStatus: status, rejectionReason: rejectionReason ?? null })
    .where(eq(medicalDriversTable.id, paramsParsed.data.id))
    .returning();
  if (!driver) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(driver));
});

function fmt(d: typeof medicalDriversTable.$inferSelect) {
  return {
    id: d.id,
    fullName: d.fullName,
    phone: d.phone,
    licenseNumber: d.licenseNumber,
    vehicleType: d.vehicleType,
    vehicleRego: d.vehicleRego,
    vehicleCapacity: d.vehicleCapacity,
    hasWheelchairAccess: d.hasWheelchairAccess,
    workingWithChildrenCheck: d.workingWithChildrenCheck,
    policeCheckDone: d.policeCheckDone,
    verificationStatus: d.verificationStatus,
    notes: d.notes ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

export default router;
