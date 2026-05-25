import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carpoolPostsTable = pgTable("carpool_posts", {
  id: serial("id").primaryKey(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  travelDate: text("travel_date").notNull(),
  travelTime: text("travel_time").notNull(),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  pricePerSeat: numeric("price_per_seat", { precision: 10, scale: 2 }).notNull().default("5.00"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCarpoolPostSchema = createInsertSchema(carpoolPostsTable).omit({
  id: true,
  availableSeats: true,
  pricePerSeat: true,
  status: true,
  createdAt: true,
});
export type InsertCarpoolPost = z.infer<typeof insertCarpoolPostSchema>;
export type CarpoolPost = typeof carpoolPostsTable.$inferSelect;
