import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalDriversTable = pgTable("medical_drivers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  licenseNumber: text("license_number").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleRego: text("vehicle_rego").notNull(),
  vehicleCapacity: integer("vehicle_capacity").notNull(),
  hasWheelchairAccess: boolean("has_wheelchair_access").notNull().default(false),
  workingWithChildrenCheck: boolean("working_with_children_check").notNull().default(false),
  policeCheckDone: boolean("police_check_done").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMedicalDriverSchema = createInsertSchema(medicalDriversTable).omit({
  id: true,
  verificationStatus: true,
  rejectionReason: true,
  createdAt: true,
});
export type InsertMedicalDriver = z.infer<typeof insertMedicalDriverSchema>;
export type MedicalDriver = typeof medicalDriversTable.$inferSelect;
