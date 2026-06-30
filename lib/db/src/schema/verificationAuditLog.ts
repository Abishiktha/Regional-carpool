import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationAuditLogTable = pgTable("verification_audit_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  action: text("action").notNull(),
  reason: text("reason"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerificationAuditLogSchema = createInsertSchema(verificationAuditLogTable).omit({
  id: true,
  decidedAt: true,
});
export type InsertVerificationAuditLog = z.infer<typeof insertVerificationAuditLogSchema>;
export type VerificationAuditLog = typeof verificationAuditLogTable.$inferSelect;
