import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalPatientsTable = pgTable("medical_patients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  suburb: text("suburb").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  medicareNumber: text("medicare_number").notNull(),
  gpName: text("gp_name").notNull(),
  gpPhone: text("gp_phone").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  mobilityNeeds: text("mobility_needs").notNull(),
  notes: text("notes"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMedicalPatientSchema = createInsertSchema(medicalPatientsTable).omit({
  id: true,
  verificationStatus: true,
  rejectionReason: true,
  createdAt: true,
});
export type InsertMedicalPatient = z.infer<typeof insertMedicalPatientSchema>;
export type MedicalPatient = typeof medicalPatientsTable.$inferSelect;
