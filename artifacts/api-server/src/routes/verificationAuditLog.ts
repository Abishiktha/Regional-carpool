import { Router } from "express";
import { db, verificationAuditLogTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { entityType, entityId } = req.query as { entityType?: string; entityId?: string };

  const conditions = [];
  if (entityType) conditions.push(eq(verificationAuditLogTable.entityType, entityType));
  if (entityId) {
    const id = Number(entityId);
    if (!isNaN(id)) conditions.push(eq(verificationAuditLogTable.entityId, id));
  }

  const entries = await db
    .select()
    .from(verificationAuditLogTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(verificationAuditLogTable.decidedAt));

  res.json(entries.map(fmt));
});

function fmt(e: typeof verificationAuditLogTable.$inferSelect) {
  return {
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    entityName: e.entityName,
    action: e.action,
    reason: e.reason ?? null,
    decidedAt: e.decidedAt.toISOString(),
  };
}

export default router;
