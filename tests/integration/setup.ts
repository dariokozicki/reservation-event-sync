import { beforeAll, afterAll } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { db, pool } from '../../src/db/client';
import { getBoss, stopBoss } from '../../src/server/queue';

export function setupDatabase() {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? 'postgres://invalid');
    if (url.pathname !== '/reservation_test') {
      throw new Error('Integration tests require the isolated reservation_test database.');
    }
    await migrate(db, { migrationsFolder: './drizzle' });
    await getBoss();
    await db.execute(sql`
      truncate email_attempts, provider_receipts, confirmations, deliveries,
      inbox, source_events, reservations, streams, pgboss.job cascade
    `);
  });
  afterAll(async () => {
    await stopBoss();
    await pool.end();
  });
}
