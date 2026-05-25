import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListNotificationsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  const { recipientType, recipientId } = parsed.success ? parsed.data : {};

  const conditions = [];
  if (recipientType) conditions.push(eq(notificationsTable.recipientType, recipientType));
  if (recipientId) conditions.push(eq(notificationsTable.recipientId, recipientId));

  const rows = conditions.length
    ? await db.select().from(notificationsTable).where(and(...conditions)).orderBy(notificationsTable.createdAt)
    : await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt);

  res.json(rows.map(fmt));
});

function fmt(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    recipientType: n.recipientType,
    recipientId: n.recipientId,
    recipientName: n.recipientName,
    recipientPhone: n.recipientPhone,
    event: n.event,
    subject: n.subject,
    message: n.message,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
  };
}

export default router;
