import { Router } from "express";
import { db, driverAvailabilityTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

const GetQuerySchema = z.object({
  driverId: z.coerce.number().int().positive(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const UpsertBodySchema = z.object({
  driverId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  available: z.boolean(),
});

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

router.get("/", async (req, res) => {
  const parsed = GetQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { driverId, weekStart } = parsed.data;
  const weekEnd = addDays(weekStart, 6);

  const rows = await db
    .select()
    .from(driverAvailabilityTable)
    .where(
      and(
        eq(driverAvailabilityTable.driverId, driverId),
        gte(driverAvailabilityTable.date, weekStart),
        lte(driverAvailabilityTable.date, weekEnd)
      )
    );

  res.json(rows.map(fmt));
});

router.post("/", async (req, res) => {
  const parsed = UpsertBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [row] = await db
    .insert(driverAvailabilityTable)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: [driverAvailabilityTable.driverId, driverAvailabilityTable.date],
      set: { available: parsed.data.available },
    })
    .returning();

  res.json(fmt(row));
});

function fmt(r: typeof driverAvailabilityTable.$inferSelect) {
  return {
    id: r.id,
    driverId: r.driverId,
    date: r.date,
    available: r.available,
  };
}

export default router;
