import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db/client';
import { reservations, streams } from '../../src/db/schema';
import { buildScenario } from '../../src/domain/scenarios';
import { detail, overview } from '../../src/server/queries';
import { ingest } from '../../src/server/sync';
import { setupDatabase } from './setup';

setupDatabase();

describe('Relational reservation storage', () => {
  it('tracks early events without inventing an incomplete reservation', async () => {
    const { id, events, source } = buildScenario('standard');
    await ingest(events[2]);
    expect(await db.query.streams.findFirst({ where: eq(streams.id, id) })).toBeDefined();
    expect(
      await db.query.reservations.findFirst({ where: eq(reservations.id, id) }),
    ).toBeUndefined();
    expect((await detail(id))?.local).toBeNull();
    expect((await overview()).reservations.find((row) => row.id === id)?.local).toBeNull();
    await ingest(events[0]);
    await ingest(events[1]);
    expect((await detail(id))?.local).toEqual(source);
    expect((await overview()).reservations.find((row) => row.id === id)?.local).toEqual(source);
  });

  it.each([{ version: 0 }, { status: 'unknown' }, { guests: 13 }, { checkOut: '2027-01-01' }])(
    'rejects invalid domain columns at the database boundary: %j',
    async (invalid) => {
      const { id, events } = buildScenario('standard');
      await ingest(events[0]);
      // Raw SQL deliberately bypasses TypeScript and Zod to exercise PostgreSQL constraints.
      const [field, value] = Object.entries(invalid)[0];
      const column = field === 'checkOut' ? 'check_out' : field;
      await expect(
        db.execute(sql`
      update reservations set ${sql.identifier(column)} = ${value} where id = ${id}
    `),
      ).rejects.toThrow();
      expect((await detail(id))?.local?.version).toBe(1);
    },
  );

  it('backfills legacy snapshots and preserves null pre-creation state', async () => {
    const migration = await readFile('drizzle/0001_normalize_reservations.sql', 'utf8');
    const namespace = `migration_${randomUUID().replaceAll('-', '')}`;
    const expected = [
      buildScenario('standard').source,
      buildScenario('cancelled').source,
      buildScenario('manual').source,
    ];
    await db.transaction(async (tx) => {
      await tx.execute(sql`create schema ${sql.identifier(namespace)}`);
      await tx.execute(sql`select set_config('search_path', ${namespace}, true)`);
      await tx.execute(sql`
        create table streams (id uuid primary key, local jsonb)
      `);
      for (const reservation of expected) {
        if (!reservation) throw new Error('Migration fixture must contain a reservation.');
        await tx.execute(sql`
          insert into streams values (${reservation.id}, ${JSON.stringify(reservation)}::jsonb)
        `);
      }
      await tx.execute(sql`insert into streams values (${randomUUID()}, null)`);
      // Run the actual migration against an isolated schema, including its foreign key.
      await tx.execute(sql.raw(migration.replaceAll('"public".', `"${namespace}".`)));
      const result = await tx.execute(sql`
        select jsonb_strip_nulls(jsonb_build_object(
          'id', id, 'version', version, 'status', status, 'guestName', guest_name,
          'guestEmail', guest_email, 'property', property, 'checkIn', check_in,
          'checkOut', check_out, 'guests', guests, 'cancellationReason', cancellation_reason
        )) as reservation from reservations
      `);
      expect(result.rows.map((row) => row.reservation)).toEqual(expect.arrayContaining(expected));
      expect(result.rows).toHaveLength(expected.length);
      const columns = await tx.execute(sql`
        select column_name from information_schema.columns
        where table_schema = ${namespace} and table_name = 'streams' and column_name = 'local'
      `);
      expect(columns.rows).toHaveLength(0);
      await tx.execute(sql`drop schema ${sql.identifier(namespace)} cascade`);
    });
  });
});
