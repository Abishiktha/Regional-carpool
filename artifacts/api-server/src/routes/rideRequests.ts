import { Router } from "express";
import { db, rideRequestsTable, rideAcceptancesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListRideRequestsQueryParams,
  CreateRideRequestBody,
  GetRideRequestParams,
  DeleteRideRequestParams,
  AcceptRideRequestParams,
  AcceptRideRequestBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListRideRequestsQueryParams.safeParse(req.query);
  const { fromLocation, toLocation, date } = query.success ? query.data : {};

  const conditions = [eq(rideRequestsTable.status, "open")];
  if (fromLocation) {
    conditions.push(sql`lower(${rideRequestsTable.fromLocation}) like lower(${"%" + fromLocation + "%"})`);
  }
  if (toLocation) {
    conditions.push(sql`lower(${rideRequestsTable.toLocation}) like lower(${"%" + toLocation + "%"})`);
  }
  if (date) {
    conditions.push(eq(rideRequestsTable.travelDate, date));
  }

  const requests = await db
    .select()
    .from(rideRequestsTable)
    .where(and(...conditions))
    .orderBy(rideRequestsTable.travelDate);

  res.json(requests.map(formatRequest));
});

router.post("/", async (req, res) => {
  const parsed = CreateRideRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { passengerName, passengerPhone, fromLocation, toLocation, travelDate, passengerCount, offeredPrice, notes } = parsed.data;
  const [request] = await db
    .insert(rideRequestsTable)
    .values({
      passengerName,
      passengerPhone,
      fromLocation,
      toLocation,
      travelDate,
      passengerCount,
      offeredPrice: String(offeredPrice),
      notes: notes ?? null,
    })
    .returning();
  res.status(201).json(formatRequest(request));
});

router.get("/:id", async (req, res) => {
  const parsed = GetRideRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [request] = await db
    .select()
    .from(rideRequestsTable)
    .where(eq(rideRequestsTable.id, parsed.data.id));
  if (!request) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatRequest(request));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteRideRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .update(rideRequestsTable)
    .set({ status: "cancelled" })
    .where(eq(rideRequestsTable.id, parsed.data.id));
  res.status(204).end();
});

router.post("/:id/accept", async (req, res) => {
  const paramsParsed = AcceptRideRequestParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = AcceptRideRequestBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input", details: bodyParsed.error.issues });
    return;
  }

  const [request] = await db
    .select()
    .from(rideRequestsTable)
    .where(eq(rideRequestsTable.id, paramsParsed.data.id));

  if (!request) {
    res.status(404).json({ error: "Ride request not found" });
    return;
  }

  if (request.status !== "open") {
    res.status(400).json({ error: "Ride request already accepted or cancelled" });
    return;
  }

  const { driverName, driverPhone } = bodyParsed.data;
  const offeredPrice = Number(request.offeredPrice);
  const commission = offeredPrice * 0.1;
  const netEarnings = offeredPrice - commission;

  const [acceptance] = await db
    .insert(rideAcceptancesTable)
    .values({
      rideRequestId: request.id,
      driverName,
      driverPhone,
      commission: String(commission),
      netEarnings: String(netEarnings),
    })
    .returning();

  await db
    .update(rideRequestsTable)
    .set({ status: "accepted", acceptedDriverName: driverName })
    .where(eq(rideRequestsTable.id, request.id));

  res.status(201).json({
    id: acceptance.id,
    rideRequestId: acceptance.rideRequestId,
    driverName: acceptance.driverName,
    driverPhone: acceptance.driverPhone,
    commission: Number(acceptance.commission),
    netEarnings: Number(acceptance.netEarnings),
    createdAt: acceptance.createdAt.toISOString(),
  });
});

function formatRequest(r: typeof rideRequestsTable.$inferSelect) {
  return {
    id: r.id,
    passengerName: r.passengerName,
    passengerPhone: r.passengerPhone,
    fromLocation: r.fromLocation,
    toLocation: r.toLocation,
    travelDate: r.travelDate,
    passengerCount: r.passengerCount,
    offeredPrice: Number(r.offeredPrice),
    notes: r.notes ?? null,
    status: r.status,
    acceptedDriverName: r.acceptedDriverName ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export default router;
