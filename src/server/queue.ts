import { PgBoss } from 'pg-boss';

export const EMAIL_QUEUE = 'reservation-confirmation';
export const DEAD_QUEUE = 'reservation-confirmation-failed';
export const RETRY_LIMIT = 3;
let pending: Promise<PgBoss> | undefined;

export function getBoss(): Promise<PgBoss> {
  if (!pending) {
    pending = initializeBoss().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
  }
  return pending;
}

async function initializeBoss(): Promise<PgBoss> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const boss = new PgBoss({ connectionString, monitorIntervalSeconds: 2 });
  boss.on('error', (error) => console.error('Queue error:', error.message));
  try {
    await boss.start();
    await boss.createQueue(DEAD_QUEUE);
    await boss.createQueue(EMAIL_QUEUE, {
      retryLimit: RETRY_LIMIT,
      retryDelay: 2,
      retryBackoff: true,
      expireInSeconds: 30,
      deadLetter: DEAD_QUEUE,
    });
    return boss;
  } catch (error) {
    // Preserve the setup error even if cleanup of a partially started instance also fails.
    await boss.stop().catch(() => undefined);
    throw error;
  }
}

export async function stopBoss() {
  if (pending) await (await pending).stop();
  pending = undefined;
}
