import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalTransportRequestsTable = pgTable("medical_transport_requests", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  appointmentId: integer("appointment_id"),
  pickupAddress: text("pickup_address").notNull(),
  pickupSuburb: text("pickup_suburb").notNull(),
  destinationName: text("destination_name").notNull(),
  destinationAddress: text("destination_address").notNull(),
  tripDate: text("trip_date").notNull(),
  tripTime: text("trip_time").notNull(),
  returnTrip: boolean("return_trip").notNull().default(false),
  returnTime: text("return_time"),
  assignedDriverId: integer("assigned_driver_id"),
  assignedDriverName: text("assigned_driver_name"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  coordinatorNotes: text("coordinator_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMedicalTransportRequestSchema = createInsertSchema(medicalTransportRequestsTable).omit({
  id: true,
  patientName: true,
  assignedDriverId: true,
  assignedDriverName: true,
  status: true,
  createdAt: true,
});
export type InsertMedicalTransportRequest = z.infer<typeof insertMedicalTransportRequestSchema>;
export type MedicalTransportRequest = typeof medicalTransportRequestsTable.$inferSelect;
