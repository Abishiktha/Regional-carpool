import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rideAcceptancesTable = pgTable("ride_acceptances", {
  id: serial("id").primaryKey(),
  rideRequestId: integer("ride_request_id").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  commission: numeric("commission", { precision: 10, scale: 2 }).notNull(),
  netEarnings: numeric("net_earnings", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideAcceptanceSchema = createInsertSchema(rideAcceptancesTable).omit({
  id: true,
  commission: true,
  netEarnings: true,
  createdAt: true,
});
export type InsertRideAcceptance = z.infer<typeof insertRideAcceptanceSchema>;
export type RideAcceptance = typeof rideAcceptancesTable.$inferSelect;
