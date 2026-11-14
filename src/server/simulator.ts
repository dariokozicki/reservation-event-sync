import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { fromDrizzle } from 'pg-boss';
import { db } from '../db/client';
import { confirmations, sourceEvents, streams } from '../db/schema';
import { applyEvent, DomainError } from '../domain/reservation';
import { buildScenario } from '../domain/scenarios';
import { appendSchema, simulationSchema } from '../domain/schemas';
import type { FaultMode, ReservationEvent } from '../types/domain';
import { EMAIL_QUEUE, getBoss } from './queue';
import { ingest, lockReservation } from './sync';

export async function simulate(raw: unknown) {
  const input = simulationSchema.parse(raw);
  const scenario = buildScenario(input.scenario, input.details);
  await db.transaction(async (tx) => {
    await tx.insert(streams).values({
      id: scenario.id,
      scenario: input.scenario,
      source: scenario.source,
      fault: scenario.fault,
    });
    await tx.insert(sourceEvents).values(
      scenario.events.map((event) => ({
        id: event.eventId,
        reservationId: event.reservationId,
        version: event.version,
        event,
      })),
    );
  });
  const results = [];
  for (const index of scenario.order) results.push(await ingest(scenario.events[index]));
  return { id: scenario.id, results };
}

export async function deliverSourceEvent(id: string, eventId: string) {
  const source = await db.query.sourceEvents.findFirst({
    where: and(eq(sourceEvents.id, eventId), eq(sourceEvents.reservationId, id)),
  });
  if (!source) throw new DomainError('Source event not found.');
  return ingest(source.event);
}

export async function appendSourceEvent(id: string, raw: unknown) {
  const change = appendSchema.parse(raw);
  const event = await db.transaction(async (tx) => {
    await lockReservation(tx, id);
    const stream = await tx.query.streams.findFirst({ where: eq(streams.id, id) });
    if (!stream?.source) throw new DomainError('Simulated source reservation not found.');
    const event: ReservationEvent = {
      ...change,
      eventId: randomUUID(),
      reservationId: id,
      version: stream.source.version + 1,
      occurredAt: new Date().toISOString(),
    };
    const source = applyEvent(stream.source, event);
    await tx.insert(sourceEvents).values({
      id: event.eventId,
      reservationId: id,
      version: event.version,
      event,
    });
    await tx.update(streams).set({ source }).where(eq(streams.id, id));
    return event;
  });
  return { event, result: await ingest(event) };
}

export async function setProviderFault(id: string, fault: FaultMode) {
  const result = await db
    .update(streams)
    .set({ fault })
    .where(eq(streams.id, id))
    .returning({ id: streams.id });
  if (!result.length) throw new DomainError('Reservation not found.');
}

export async function retryEmail(id: string) {
  const boss = await getBoss();
  return db.transaction(async (tx) => {
    await lockReservation(tx, id);
    const email = await tx.query.confirmations.findFirst({
      where: eq(confirmations.reservationId, id),
    });
    if (!email || email.status !== 'failed') {
      throw new DomainError('Only failed confirmation emails can be retried manually.');
    }
    const jobId = await boss.send(EMAIL_QUEUE, email.payload, { db: fromDrizzle(tx, sql) });
    if (!jobId) throw new Error('Retry job was not created.');
    await tx
      .update(confirmations)
      .set({ jobId, status: 'pending', lastError: null })
      .where(eq(confirmations.reservationId, id));
    return { jobId };
  });
}
