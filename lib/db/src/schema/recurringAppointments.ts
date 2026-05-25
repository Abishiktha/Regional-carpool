import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recurringAppointmentsTable = pgTable("recurring_appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  clinicName: text("clinic_name").notNull(),
  clinicAddress: text("clinic_address").notNull(),
  clinicSuburb: text("clinic_suburb").notNull(),
  appointmentType: text("appointment_type").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  frequencyWeeks: integer("frequency_weeks").notNull(),
  nextDate: text("next_date").notNull(),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecurringAppointmentSchema = createInsertSchema(recurringAppointmentsTable).omit({
  id: true,
  active: true,
  createdAt: true,
});
export type InsertRecurringAppointment = z.infer<typeof insertRecurringAppointmentSchema>;
export type RecurringAppointment = typeof recurringAppointmentsTable.$inferSelect;
