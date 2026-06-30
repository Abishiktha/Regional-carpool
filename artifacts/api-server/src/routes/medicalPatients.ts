import { Router } from "express";
import { db, medicalPatientsTable, verificationAuditLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterMedicalPatientBody,
  GetMedicalPatientParams,
  VerifyMedicalPatientParams,
  VerifyMedicalPatientBody,
} from "@workspace/api-zod";
import { notifyPatientApproved, notifyPatientRejected } from "../lib/notifications";

const router = Router();

router.get("/", async (_req, res) => {
  const patients = await db.select().from(medicalPatientsTable).orderBy(medicalPatientsTable.createdAt);
  res.json(patients.map(fmt));
});

router.post("/", async (req, res) => {
  const parsed = RegisterMedicalPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [patient] = await db.insert(medicalPatientsTable).values(parsed.data).returning();
  res.status(201).json(fmt(patient));
});

router.get("/:id", async (req, res) => {
  const parsed = GetMedicalPatientParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db.select().from(medicalPatientsTable).where(eq(medicalPatientsTable.id, parsed.data.id));
  if (!patient) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(patient));
});

router.post("/:id/verify", async (req, res) => {
  const paramsParsed = VerifyMedicalPatientParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = VerifyMedicalPatientBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { status, rejectionReason } = bodyParsed.data;
  const [patient] = await db
    .update(medicalPatientsTable)
    .set({ verificationStatus: status, rejectionReason: rejectionReason ?? null })
    .where(eq(medicalPatientsTable.id, paramsParsed.data.id))
    .returning();
  if (!patient) { res.status(404).json({ error: "Not found" }); return; }

  await db.insert(verificationAuditLogTable).values({
    entityType: "patient",
    entityId: patient.id,
    entityName: patient.fullName,
    action: status,
    reason: rejectionReason ?? null,
  });

  if (status === "approved") {
    await notifyPatientApproved({ patientId: patient.id, fullName: patient.fullName, phone: patient.phone, suburb: patient.suburb });
  } else if (status === "rejected") {
    await notifyPatientRejected({ patientId: patient.id, fullName: patient.fullName, phone: patient.phone, rejectionReason: rejectionReason ?? "No reason provided" });
  }

  res.json(fmt(patient));
});

function fmt(p: typeof medicalPatientsTable.$inferSelect) {
  return {
    id: p.id,
    fullName: p.fullName,
    dateOfBirth: p.dateOfBirth,
    phone: p.phone,
    address: p.address,
    suburb: p.suburb,
    state: p.state,
    postcode: p.postcode,
    medicareNumber: p.medicareNumber,
    gpName: p.gpName,
    gpPhone: p.gpPhone,
    emergencyContactName: p.emergencyContactName,
    emergencyContactPhone: p.emergencyContactPhone,
    mobilityNeeds: p.mobilityNeeds,
    notes: p.notes ?? null,
    verificationStatus: p.verificationStatus,
    rejectionReason: p.rejectionReason ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
