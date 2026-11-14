import { and, eq, or, sql } from 'drizzle-orm';
import { fromDrizzle } from 'pg-boss';
import { db } from '../db/client';
import { confirmations, deliveries, inbox, reservations, streams } from '../db/schema';
import { toReservation } from '../db/reservation-mapping';
import { fingerprint } from '../domain/fingerprint';
import { confirmationFor } from '../domain/confirmation';
import { applyEvent, DomainError } from '../domain/reservation';
import { eventSchema } from '../domain/schemas';
import type { Transaction } from '../types/database';
import type { Reservation, ReservationEvent, SyncResult } from '../types/domain';
import { EMAIL_QUEUE, getBoss } from './queue';

export async function lockReservation(tx: Transaction, id: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${id}, 0))`);
}

async function scheduleConfirmation(tx: Transaction, state: Reservation) {
  const existing = await tx.query.confirmations.findFirst({
    where: eq(confirmations.reservationId, state.id),
  });
  if (existing) return;
  const payload = confirmationFor(state, process.env.APP_BASE_URL);
  const boss = await getBoss();
  const jobId = await boss.send(EMAIL_QUEUE, payload, { db: fromDrizzle(tx, sql) });
  if (!jobId) throw new Error('Confirmation job was not created.');
  await tx.insert(confirmations).values({
    reservationId: state.id,
    key: payload.key,
    payload,
    jobId,
    status: 'pending',
  });
}

async function drain(tx: Transaction, id: string): Promise<SyncResult> {
  const row = await tx.query.reservations.findFirst({ where: eq(reservations.id, id) });
  let state = toReservation(row);
  const appliedVersions: number[] = [];
  while (true) {
    const next = await tx.query.inbox.findFirst({
      where: and(eq(inbox.reservationId, id), eq(inbox.version, (state?.version ?? 0) + 1)),
    });
    if (!next) break;
    try {
      state = applyEvent(state, next.event);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      await tx
        .update(inbox)
        .set({ state: 'blocked', error: error.message })
        .where(eq(inbox.id, next.id));
      return { outcome: 'blocked', appliedVersions, message: error.message };
    }
    if (next.event.type === 'confirmed') await scheduleConfirmation(tx, state);
    const values = { ...state, cancellationReason: state.cancellationReason ?? null };
    await tx.insert(reservations).values(values).onConflictDoUpdate({
      target: reservations.id,
      set: values,
    });
    await tx
      .update(inbox)
      .set({ state: 'applied', appliedAt: new Date(), error: null })
      .where(eq(inbox.id, next.id));
    appliedVersions.push(state.version);
  }
  return {
    outcome: appliedVersions.length ? 'applied' : 'buffered',
    appliedVersions,
    message: appliedVersions.length
      ? `Applied version${appliedVersions.length > 1 ? 's' : ''} ${appliedVersions.join(', ')}.`
      : `Waiting for version ${(state?.version ?? 0) + 1}.`,
  };
}

async function receive(tx: Transaction, event: ReservationEvent): Promise<SyncResult> {
  const hash = fingerprint(event);
  const match = or(
    eq(inbox.id, event.eventId),
    and(eq(inbox.reservationId, event.reservationId), eq(inbox.version, event.version)),
  );
  const inserted = await tx
    .insert(inbox)
    .values({
      id: event.eventId,
      reservationId: event.reservationId,
      version: event.version,
      event,
      hash,
      state: 'buffered',
    })
    .onConflictDoNothing()
    .returning({ id: inbox.id });
  if (!inserted.length) {
    const existing = await tx.query.inbox.findFirst({ where: match });
    const identical = existing?.hash === hash;
    return {
      outcome: identical ? 'duplicate' : 'conflict',
      appliedVersions: [],
      message: identical
        ? 'Identical event already received. No changes made.'
        : 'Event ID or reservation/version already exists with different content.',
    };
  }
  return drain(tx, event.reservationId);
}

export async function ingest(raw: unknown): Promise<SyncResult> {
  const event = eventSchema.parse(raw);
  await getBoss();
  return db.transaction(async (tx) => {
    await lockReservation(tx, event.reservationId);
    await tx.insert(streams).values({ id: event.reservationId }).onConflictDoNothing();
    const result = await receive(tx, event);
    await tx.insert(deliveries).values({
      reservationId: event.reservationId,
      eventId: event.eventId,
      version: event.version,
      outcome: result.outcome,
      message: result.message,
    });
    return result;
  });
}
