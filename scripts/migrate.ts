import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../src/db/client';
import { getBoss, stopBoss } from '../src/server/queue';

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  await getBoss();
  console.log('Database and queues ready.');
} finally {
  await stopBoss();
  await pool.end();
}
