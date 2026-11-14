import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { attempts, receipts, streams } from '../db/schema';
import { fingerprint } from '../domain/fingerprint';
import type { EmailPayload } from '../types/domain';

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${payload.key}, 0))`);
    const receipt = await tx.query.receipts.findFirst({ where: eq(receipts.key, payload.key) });
    const hash = fingerprint(payload);
    if (receipt && receipt.hash !== hash) {
      throw new Error('Provider rejected idempotency key reuse with a changed payload.');
    }
    const record = async (outcome: string, message: string) => {
      await tx.insert(attempts).values({ reservationId: payload.reservationId, outcome, message });
    };
    if (receipt) {
      await record('deduplicated', 'Existing receipt returned. No additional email sent.');
      return { error: null };
    }
    const stream = await tx.query.streams.findFirst({
      where: eq(streams.id, payload.reservationId),
    });
    const previous = await tx.query.attempts.findFirst({
      where: eq(attempts.reservationId, payload.reservationId),
    });
    if (stream?.fault === 'always_fail' || (stream?.fault === 'fail_once' && !previous)) {
      await record('rejected', 'Simulated provider unavailable. Email was not accepted.');
      return { error: 'Simulated provider unavailable.' };
    }
    await tx.insert(receipts).values({
      key: payload.key,
      reservationId: payload.reservationId,
      payload,
      hash,
    });
    if (stream?.fault === 'lose_ack_once' && !previous) {
      await record(
        'response_lost',
        'Email accepted, but the response was lost. Worker will retry.',
      );
      return { error: 'Simulated timeout after provider acceptance.' };
    }
    await record('accepted', 'Provider accepted one confirmation email.');
    return { error: null };
  });
  // Throw only after the provider transaction commits: acceptance survives a lost acknowledgement.
  if (result.error) throw new Error(result.error);
}
