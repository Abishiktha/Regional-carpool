import { Router } from "express";
import { db, medicalTransportRequestsTable, medicalPatientsTable, medicalDriversTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { notifyDriverAssigned, notifyTripCompleted } from "../lib/notifications";
import {
  ListMedicalTransportRequestsQueryParams,
  CreateMedicalTransportRequestBody,
  GetMedicalTransportRequestParams,
  AssignMedicalDriverParams,
  AssignMedicalDriverBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListMedicalTransportRequestsQueryParams.safeParse(req.query);
  const { patientId, assignedDriverId, status } = parsed.success ? parsed.data : {};

  const conditions = [];
  if (patientId) conditions.push(eq(medicalTransportRequestsTable.patientId, patientId));
  if (assignedDriverId) conditions.push(eq(medicalTransportRequestsTable.assignedDriverId, assignedDriverId));
  if (status) conditions.push(eq(medicalTransportRequestsTable.status, status));

  const rows = conditions.length
    ? await db.select().from(medicalTransportRequestsTable).where(and(...conditions))
    : await db.select().from(medicalTransportRequestsTable);

  res.json(rows.map(fmt));
});

router.post("/", async (req, res) => {
  const parsed = CreateMedicalTransportRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [patient] = await db
    .select()
    .from(medicalPatientsTable)
    .where(eq(medicalPatientsTable.id, parsed.data.patientId));

  if (!patient) {
    res.status(400).json({ error: "Patient not found" });
    return;
  }
  if (patient.verificationStatus !== "approved") {
    res.status(400).json({ error: "Patient must be verified before booking transport" });
    return;
  }

  const [request] = await db
    .insert(medicalTransportRequestsTable)
    .values({ ...parsed.data, patientName: patient.fullName })
    .returning();

  res.status(201).json(fmt(request));
});

router.get("/:id", async (req, res) => {
  const parsed = GetMedicalTransportRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(medicalTransportRequestsTable).where(eq(medicalTransportRequestsTable.id, parsed.data.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.post("/:id/complete", async (req, res) => {
  const parsed = GetMedicalTransportRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [request] = await db
    .select()
    .from(medicalTransportRequestsTable)
    .where(eq(medicalTransportRequestsTable.id, parsed.data.id));

  if (!request) { res.status(404).json({ error: "Transport request not found" }); return; }
  if (request.status !== "assigned") {
    res.status(400).json({ error: "Only assigned trips can be marked as completed" });
    return;
  }

  const [updated] = await db
    .update(medicalTransportRequestsTable)
    .set({ status: "completed" })
    .where(eq(medicalTransportRequestsTable.id, request.id))
    .returning();

  const [patient] = await db
    .select()
    .from(medicalPatientsTable)
    .where(eq(medicalPatientsTable.id, request.patientId));

  if (patient && request.assignedDriverName) {
    await notifyTripCompleted({
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      driverName: request.assignedDriverName,
      tripDate: request.tripDate,
      destinationName: request.destinationName,
    });
  }

  res.json(fmt(updated));
});

router.post("/:id/assign", async (req, res) => {
  const paramsParsed = AssignMedicalDriverParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = AssignMedicalDriverBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [request] = await db
    .select()
    .from(medicalTransportRequestsTable)
    .where(eq(medicalTransportRequestsTable.id, paramsParsed.data.id));

  if (!request) { res.status(404).json({ error: "Transport request not found" }); return; }
  if (request.status !== "pending") {
    res.status(400).json({ error: "Transport request already assigned or completed" });
    return;
  }

  const [driver] = await db
    .select()
    .from(medicalDriversTable)
    .where(eq(medicalDriversTable.id, bodyParsed.data.driverId));

  if (!driver) { res.status(400).json({ error: "Driver not found" }); return; }
  if (driver.verificationStatus !== "approved") {
    res.status(400).json({ error: "Driver must be verified before being assigned" });
    return;
  }

  const [updated] = await db
    .update(medicalTransportRequestsTable)
    .set({
      assignedDriverId: driver.id,
      assignedDriverName: driver.fullName,
      status: "assigned",
    })
    .where(eq(medicalTransportRequestsTable.id, request.id))
    .returning();

  const [patient] = await db
    .select()
    .from(medicalPatientsTable)
    .where(eq(medicalPatientsTable.id, request.patientId));

  if (patient) {
    await notifyDriverAssigned({
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      driverName: driver.fullName,
      tripDate: request.tripDate,
      tripTime: request.tripTime,
      destinationName: request.destinationName,
      pickupAddress: request.pickupAddress,
      pickupSuburb: request.pickupSuburb,
      returnTrip: request.returnTrip,
      returnTime: request.returnTime ?? null,
    });
  }

  res.json(fmt(updated));
});

function fmt(r: typeof medicalTransportRequestsTable.$inferSelect) {
  return {
    id: r.id,
    patientId: r.patientId,
    patientName: r.patientName,
    appointmentId: r.appointmentId ?? null,
    pickupAddress: r.pickupAddress,
    pickupSuburb: r.pickupSuburb,
    destinationName: r.destinationName,
    destinationAddress: r.destinationAddress,
    tripDate: r.tripDate,
    tripTime: r.tripTime,
    returnTrip: r.returnTrip,
    returnTime: r.returnTime ?? null,
    assignedDriverId: r.assignedDriverId ?? null,
    assignedDriverName: r.assignedDriverName ?? null,
    status: r.status,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export default router;
