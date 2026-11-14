import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { confirmations, inbox, streams } from '../../src/db/schema';
import { buildScenario } from '../../src/domain/scenarios';
import { ingest } from '../../src/server/sync';
import { detail } from '../../src/server/queries';
import { setupDatabase } from './setup';

setupDatabase();

function permutations<T>(items: T[]): T[][] {
  if (!items.length) return [[]];
  return items.flatMap((item, index) =>
    permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]),
  );
}

describe('PostgreSQL synchronization', () => {
  it('all 24 delivery permutations converge and enqueue one confirmation', async () => {
    for (const order of permutations([0, 1, 2, 3])) {
      const scenario = buildScenario('cancelled');
      for (const index of order) await ingest(scenario.events[index]);
      const result = await detail(scenario.id);
      expect(result?.local).toEqual(scenario.source);
      expect(result?.inbox.every((event) => event.state === 'applied')).toBe(true);
      expect(result?.confirmation?.payload.body).toContain('Guests: 3');
      const jobs = await db.execute(sql`
        select count(*)::int as count from pgboss.job
        where data->>'reservationId' = ${scenario.id}
      `);
      expect(jobs.rows[0].count).toBe(1);
    }
  });

  it('concurrent deliveries apply each event once and keep one job', async () => {
    const { id, events, source } = buildScenario('standard');
    await Promise.all([...events, ...events, ...events].map(ingest));
    const result = await detail(id);
    expect(result?.local).toEqual(source);
    expect(result?.inbox).toHaveLength(3);
    expect(result?.deliveries.filter((item) => item.outcome === 'duplicate')).toHaveLength(6);
    const jobs = await db.execute(sql`
      select count(*)::int as count from pgboss.job where data->>'reservationId' = ${id}
    `);
    expect(jobs.rows[0].count).toBe(1);
  });

  it('holds a gap without scheduling email, then drains when the gap is filled', async () => {
    const { id, events } = buildScenario('standard');
    await ingest(events[0]);
    expect((await ingest(events[2])).outcome).toBe('buffered');
    let result = await detail(id);
    expect(result?.local?.status).toBe('pending');
    expect(result?.confirmation).toBeNull();
    expect((await ingest(events[1])).appliedVersions).toEqual([2, 3]);
    result = await detail(id);
    expect(result?.local?.status).toBe('confirmed');
    expect(result?.confirmation).not.toBeNull();
  });

  it('rejects conflicting IDs and versions without overwriting the accepted event', async () => {
    const { id, events } = buildScenario('standard');
    await ingest(events[0]);
    expect((await ingest({ ...events[0], occurredAt: '2026-01-01T00:00:00Z' })).outcome).toBe(
      'conflict',
    );
    expect((await ingest({ ...events[0], eventId: randomUUID() })).outcome).toBe('conflict');
    expect((await detail(id))?.local?.version).toBe(1);
  });

  it('blocks invalid transitions without losing or skipping later versions', async () => {
    const { id, events } = buildScenario('standard');
    await ingest(events[0]);
    await ingest({ ...events[1], type: 'cancelled', payload: { reason: 'No longer needed.' } });
    expect((await ingest(events[2])).outcome).toBe('blocked');
    await ingest({ ...events[2], eventId: randomUUID(), version: 4 });
    const result = await detail(id);
    expect(result?.local?.version).toBe(2);
    expect(result?.inbox.find((item) => item.version === 3)?.state).toBe('blocked');
    expect(result?.inbox.find((item) => item.version === 4)?.state).toBe('buffered');
    expect(result?.confirmation).toBeNull();
  });

  it('a pending cancellation does not create an email', async () => {
    const { id, events } = buildScenario('unconfirmed_cancelled');
    await ingest(events[1]);
    await ingest(events[0]);
    expect((await detail(id))?.local?.status).toBe('cancelled');
    expect((await detail(id))?.confirmation).toBeNull();
  });

  it('rolls back state and job when confirmation persistence fails', async () => {
    const { id, events } = buildScenario('standard');
    await ingest(events[0]);
    await ingest(events[1]);
    // A reservation-specific trigger faults after the pg-boss job insert, before commit.
    await db.execute(
      sql.raw(`
      create function reject_test_confirmation() returns trigger language plpgsql as $$
      begin
        if new.reservation_id = '${id}'::uuid then
          raise exception 'Injected confirmation write failure';
        end if;
        return new;
      end $$;
      create trigger reject_confirmation before insert on confirmations
      for each row execute function reject_test_confirmation();
    `),
    );
    try {
      await expect(ingest(events[2])).rejects.toThrow();
      expect((await detail(id))?.local?.version).toBe(2);
      const found = await db.select().from(inbox).where(eq(inbox.id, events[2].eventId));
      expect(found).toHaveLength(0);
      const jobs = await db.execute(sql`
        select count(*)::int as count from pgboss.job where data->>'reservationId' = ${id}
      `);
      expect(jobs.rows[0].count).toBe(0);
    } finally {
      await db.execute(sql`drop trigger reject_confirmation on confirmations`);
      await db.execute(sql`drop function reject_test_confirmation()`);
    }
    await ingest(events[2]);
    expect((await detail(id))?.confirmation).not.toBeNull();
  });

  it('keeps a confirmation payload frozen after later guest updates', async () => {
    const { id, events } = buildScenario('standard');
    for (const event of events) await ingest(event);
    await ingest({
      ...events[1],
      eventId: randomUUID(),
      version: 4,
      payload: { guestEmail: 'changed@example.com' },
    });
    const email = await db.query.confirmations.findFirst({
      where: eq(confirmations.reservationId, id),
    });
    expect(email?.payload.to).toBe('alex@example.com');
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, id) });
    expect(stream?.local?.guestEmail).toBe('changed@example.com');
  });
});
