import { Router } from "express";
import { db, carpoolPostsTable, rideRequestsTable, bookingsTable, rideAcceptancesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [
    carpoolStats,
    rideStats,
    bookingCount,
    acceptanceCount,
    seatsAvailable,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
      })
      .from(carpoolPostsTable),
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'open')::int`,
      })
      .from(rideRequestsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(rideAcceptancesTable),
    db
      .select({ seats: sql<number>`coalesce(sum(available_seats), 0)::int` })
      .from(carpoolPostsTable)
      .where(eq(carpoolPostsTable.status, "active")),
  ]);

  res.json({
    totalCarpoolPosts: carpoolStats[0].total,
    activeCarpoolPosts: carpoolStats[0].active,
    totalRideRequests: rideStats[0].total,
    activeRideRequests: rideStats[0].active,
    totalBookings: bookingCount[0].count,
    totalAcceptances: acceptanceCount[0].count,
    seatsAvailable: seatsAvailable[0].seats,
  });
});

export default router;
