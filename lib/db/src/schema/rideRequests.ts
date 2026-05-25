import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rideRequestsTable = pgTable("ride_requests", {
  id: serial("id").primaryKey(),
  passengerName: text("passenger_name").notNull(),
  passengerPhone: text("passenger_phone").notNull(),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  travelDate: text("travel_date").notNull(),
  passengerCount: integer("passenger_count").notNull(),
  offeredPrice: numeric("offered_price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("open"),
  acceptedDriverName: text("accepted_driver_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideRequestSchema = createInsertSchema(rideRequestsTable).omit({
  id: true,
  status: true,
  acceptedDriverName: true,
  createdAt: true,
});
export type InsertRideRequest = z.infer<typeof insertRideRequestSchema>;
export type RideRequest = typeof rideRequestsTable.$inferSelect;
