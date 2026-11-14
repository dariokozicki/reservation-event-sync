import { asc, count, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { deliveries, receipts, streams } from '../db/schema';

export async function overview() {
  const [reservations, reservationCount, deliveryCount, duplicateCount, emailCount] =
    await Promise.all([
      db.select().from(streams).orderBy(desc(streams.createdAt)).limit(100),
      db.select({ value: count() }).from(streams),
      db.select({ value: count() }).from(deliveries),
      db.select({ value: count() }).from(deliveries).where(eq(deliveries.outcome, 'duplicate')),
      db.select({ value: count() }).from(receipts),
    ]);
  return {
    reservations,
    totals: {
      reservations: reservationCount[0].value,
      deliveries: deliveryCount[0].value,
      duplicates: duplicateCount[0].value,
      emails: emailCount[0].value,
    },
  };
}

export async function detail(id: string) {
  return db.transaction(
    async (tx) => {
      const stream = await tx.query.streams.findFirst({ where: eq(streams.id, id) });
      if (!stream) return null;
      const events = await tx.query.sourceEvents.findMany({
        where: (table, { eq }) => eq(table.reservationId, id),
        orderBy: (table) => asc(table.version),
      });
      const inbox = await tx.query.inbox.findMany({
        where: (table, { eq }) => eq(table.reservationId, id),
        orderBy: (table) => asc(table.version),
      });
      const deliveries = await tx.query.deliveries.findMany({
        where: (table, { eq }) => eq(table.reservationId, id),
        orderBy: (table) => desc(table.receivedAt),
        limit: 200,
      });
      const confirmation = await tx.query.confirmations.findFirst({
        where: (table, { eq }) => eq(table.reservationId, id),
      });
      const receipt = await tx.query.receipts.findFirst({
        where: (table, { eq }) => eq(table.reservationId, id),
      });
      const attempts = await tx.query.attempts.findMany({
        where: (table, { eq }) => eq(table.reservationId, id),
        orderBy: (table) => asc(table.createdAt),
        limit: 200,
      });
      return {
        ...stream,
        events,
        inbox,
        deliveries,
        confirmation: confirmation ?? null,
        receipt: receipt ?? null,
        attempts,
      };
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' },
  );
}
