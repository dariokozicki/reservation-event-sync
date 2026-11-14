import { asc, count, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { deliveries, receipts, reservations, streams } from '../db/schema';
import { toReservation } from '../db/reservation-mapping';

export async function overview() {
  const [rows, reservationCount, deliveryCount, duplicateCount, emailCount] = await Promise.all([
    db
      .select({ stream: streams, reservation: reservations })
      .from(streams)
      .leftJoin(reservations, eq(streams.id, reservations.id))
      .orderBy(desc(streams.createdAt))
      .limit(100),
    db.select({ value: count() }).from(streams),
    db.select({ value: count() }).from(deliveries),
    db.select({ value: count() }).from(deliveries).where(eq(deliveries.outcome, 'duplicate')),
    db.select({ value: count() }).from(receipts),
  ]);
  return {
    reservations: rows.map(({ stream, reservation }) => ({
      ...stream,
      local: toReservation(reservation),
    })),
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
      const reservation = await tx.query.reservations.findFirst({
        where: eq(reservations.id, id),
      });
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
        local: toReservation(reservation),
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
