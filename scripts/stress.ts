import { performance } from 'node:perf_hooks';
import { writeFile, mkdir } from 'node:fs/promises';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../src/db/client';
import { sourceEvents, streams } from '../src/db/schema';
import { buildStressRun, stressOptionsSchema } from '../src/domain/stress-fixture';
import { startEmailWorker } from '../src/server/email-worker';
import { stopBoss } from '../src/server/queue';
import { ingest } from '../src/server/sync';
import type { StressOutcomeCounts, StressReport } from '../src/types/stress';
import { verifyStress, waitForEmails } from './stress-verify';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? 'postgres://invalid');
  if (url.pathname !== '/reservation_stress') {
    throw new Error('Stress runs require the isolated reservation_stress database.');
  }
  const options = stressOptionsSchema.parse({
    seed: process.env.STRESS_SEED,
    reservations: process.env.STRESS_RESERVATIONS,
    concurrency: process.env.STRESS_CONCURRENCY,
  });
  const run = buildStressRun(options);
  const started = performance.now();
  await migrate(db, { migrationsFolder: './drizzle' });
  await startEmailWorker();
  await db.insert(streams).values(
    run.cases.map((item) => ({
      id: item.id,
      scenario: 'stress',
      source: item.expected,
      fault: item.fault,
    })),
  );
  await db.insert(sourceEvents).values(
    run.cases.flatMap((item) =>
      item.events.map((event) => ({
        id: event.eventId,
        reservationId: item.id,
        version: event.version,
        event,
      })),
    ),
  );
  const counts: StressOutcomeCounts = {
    applied: 0,
    buffered: 0,
    duplicate: 0,
    conflict: 0,
    blocked: 0,
  };
  let cursor = 0;
  const ingestionStarted = performance.now();
  const workers = Array.from({ length: options.concurrency }, async () => {
    while (cursor < run.deliveries.length) {
      const delivery = run.deliveries[cursor++];
      const result = await ingest(delivery.event);
      counts[result.outcome]++;
    }
  });
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
  const ingestMs = Math.round(performance.now() - ingestionStarted);
  await waitForEmails(run.cases);
  const checked = await verifyStress(run.cases);
  const uniqueEvents = run.cases.reduce((total, item) => total + item.events.length, 0);
  const report: StressReport = {
    passed:
      checked.mismatches.length === 0 &&
      counts.conflict === 0 &&
      counts.blocked === 0 &&
      counts.duplicate === run.deliveries.length - uniqueEvents,
    options,
    planHash: run.planHash,
    totals: {
      reservations: run.cases.length,
      uniqueEvents,
      deliveries: run.deliveries.length,
      duplicates: counts.duplicate,
      expectedEmails: run.cases.filter((item) => item.expectsEmail).length,
      acceptedEmails: checked.acceptedEmails,
      emailAttempts: checked.emailAttempts,
      conflicts: counts.conflict,
      blocked: counts.blocked,
    },
    timingsMs: { ingest: ingestMs, total: Math.round(performance.now() - started) },
    mismatches: checked.mismatches,
  };
  const json = JSON.stringify(report, null, 2);
  await mkdir('reports', { recursive: true });
  await writeFile('reports/stress-last.json', json + '\n');
  console.log(json);
  if (!report.passed) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopBoss();
  await pool.end();
}
