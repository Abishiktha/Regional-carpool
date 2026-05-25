import { Router } from "express";
import { db, carpoolPostsTable, bookingsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListCarpoolPostsQueryParams,
  CreateCarpoolPostBody,
  GetCarpoolPostParams,
  DeleteCarpoolPostParams,
  BookCarpoolPostParams,
  BookCarpoolPostBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListCarpoolPostsQueryParams.safeParse(req.query);
  const { fromLocation, toLocation, date } = query.success ? query.data : {};

  const conditions = [eq(carpoolPostsTable.status, "active")];
  if (fromLocation) {
    conditions.push(sql`lower(${carpoolPostsTable.fromLocation}) like lower(${"%" + fromLocation + "%"})`);
  }
  if (toLocation) {
    conditions.push(sql`lower(${carpoolPostsTable.toLocation}) like lower(${"%" + toLocation + "%"})`);
  }
  if (date) {
    conditions.push(eq(carpoolPostsTable.travelDate, date));
  }

  const posts = await db
    .select()
    .from(carpoolPostsTable)
    .where(and(...conditions))
    .orderBy(carpoolPostsTable.travelDate);

  res.json(posts.map(formatPost));
});

router.post("/", async (req, res) => {
  const parsed = CreateCarpoolPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { driverName, driverPhone, fromLocation, toLocation, travelDate, travelTime, totalSeats, notes } = parsed.data;
  const [post] = await db
    .insert(carpoolPostsTable)
    .values({
      driverName,
      driverPhone,
      fromLocation,
      toLocation,
      travelDate,
      travelTime,
      totalSeats,
      availableSeats: totalSeats,
      notes: notes ?? null,
    })
    .returning();
  res.status(201).json(formatPost(post));
});

router.get("/:id", async (req, res) => {
  const parsed = GetCarpoolPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [post] = await db
    .select()
    .from(carpoolPostsTable)
    .where(eq(carpoolPostsTable.id, parsed.data.id));
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatPost(post));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteCarpoolPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .update(carpoolPostsTable)
    .set({ status: "cancelled" })
    .where(eq(carpoolPostsTable.id, parsed.data.id));
  res.status(204).end();
});

router.post("/:id/book", async (req, res) => {
  const paramsParsed = BookCarpoolPostParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = BookCarpoolPostBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input", details: bodyParsed.error.issues });
    return;
  }

  const [post] = await db
    .select()
    .from(carpoolPostsTable)
    .where(eq(carpoolPostsTable.id, paramsParsed.data.id));

  if (!post) {
    res.status(404).json({ error: "Carpool post not found" });
    return;
  }

  const { passengerName, passengerPhone, seatsBooked } = bodyParsed.data;

  if (post.availableSeats < seatsBooked) {
    res.status(400).json({ error: "Not enough seats available" });
    return;
  }

  const pricePerSeat = Number(post.pricePerSeat);
  const totalPaid = pricePerSeat * seatsBooked;
  const newAvailable = post.availableSeats - seatsBooked;

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      carpoolPostId: post.id,
      passengerName,
      passengerPhone,
      seatsBooked,
      totalPaid: String(totalPaid),
    })
    .returning();

  await db
    .update(carpoolPostsTable)
    .set({
      availableSeats: newAvailable,
      status: newAvailable === 0 ? "full" : "active",
    })
    .where(eq(carpoolPostsTable.id, post.id));

  res.status(201).json({
    id: booking.id,
    carpoolPostId: booking.carpoolPostId,
    passengerName: booking.passengerName,
    passengerPhone: booking.passengerPhone,
    seatsBooked: booking.seatsBooked,
    totalPaid: Number(booking.totalPaid),
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  });
});

function formatPost(post: typeof carpoolPostsTable.$inferSelect) {
  return {
    id: post.id,
    driverName: post.driverName,
    driverPhone: post.driverPhone,
    fromLocation: post.fromLocation,
    toLocation: post.toLocation,
    travelDate: post.travelDate,
    travelTime: post.travelTime,
    totalSeats: post.totalSeats,
    availableSeats: post.availableSeats,
    pricePerSeat: Number(post.pricePerSeat),
    notes: post.notes ?? null,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
  };
}

export default router;
