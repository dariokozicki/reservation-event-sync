import { and, eq, ne } from 'drizzle-orm';
import { db } from '../db/client';
import { confirmations } from '../db/schema';
import type { EmailPayload } from '../types/domain';
import { sendEmail } from './provider';
import { EMAIL_QUEUE, getBoss, RETRY_LIMIT } from './queue';

export async function startEmailWorker() {
  const boss = await getBoss();
  await boss.work<EmailPayload>(
    EMAIL_QUEUE,
    { pollingIntervalSeconds: 1, includeMetadata: true, batchSize: 1 },
    async ([job]) => {
      try {
        await sendEmail(job.data);
        await db
          .update(confirmations)
          .set({
            status: 'delivered',
            deliveredAt: new Date(),
            lastError: null,
          })
          .where(eq(confirmations.key, job.data.key));
      } catch (error) {
        await db
          .update(confirmations)
          .set({
            status: job.retryCount >= RETRY_LIMIT ? 'failed' : 'retrying',
            lastError: error instanceof Error ? error.message : 'Email delivery failed.',
          })
          .where(and(eq(confirmations.key, job.data.key), ne(confirmations.status, 'delivered')));
        throw error;
      }
    },
  );
  return boss;
}
