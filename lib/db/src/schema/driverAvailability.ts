import { pgTable, text, serial, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const driverAvailabilityTable = pgTable(
  "driver_availability",
  {
    id: serial("id").primaryKey(),
    driverId: integer("driver_id").notNull(),
    date: text("date").notNull(),
    available: boolean("available").notNull().default(true),
  },
  (t) => [uniqueIndex("driver_availability_driver_date_idx").on(t.driverId, t.date)]
);

export type DriverAvailability = typeof driverAvailabilityTable.$inferSelect;
