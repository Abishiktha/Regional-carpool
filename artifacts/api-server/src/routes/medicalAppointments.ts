import { Router } from "express";
import { db, recurringAppointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListRecurringAppointmentsQueryParams,
  CreateRecurringAppointmentBody,
  DeleteRecurringAppointmentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListRecurringAppointmentsQueryParams.safeParse(req.query);
  const patientId = parsed.success ? parsed.data.patientId : undefined;

  const rows = patientId
    ? await db.select().from(recurringAppointmentsTable).where(eq(recurringAppointmentsTable.patientId, patientId))
    : await db.select().from(recurringAppointmentsTable);

  res.json(rows.map(fmt));
});

router.post("/", async (req, res) => {
  const parsed = CreateRecurringAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [appt] = await db.insert(recurringAppointmentsTable).values(parsed.data).returning();
  res.status(201).json(fmt(appt));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteRecurringAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db
    .update(recurringAppointmentsTable)
    .set({ active: false })
    .where(eq(recurringAppointmentsTable.id, parsed.data.id));
  res.status(204).end();
});

function fmt(a: typeof recurringAppointmentsTable.$inferSelect) {
  return {
    id: a.id,
    patientId: a.patientId,
    clinicName: a.clinicName,
    clinicAddress: a.clinicAddress,
    clinicSuburb: a.clinicSuburb,
    appointmentType: a.appointmentType,
    dayOfWeek: a.dayOfWeek,
    appointmentTime: a.appointmentTime,
    frequencyWeeks: a.frequencyWeeks,
    nextDate: a.nextDate,
    active: a.active,
    notes: a.notes ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

export default router;
