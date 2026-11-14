import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { receipts, streams } from '../../src/db/schema';
import { confirmationFor } from '../../src/domain/confirmation';

import { buildScenario } from '../../src/domain/scenarios';
import { sendEmail } from '../../src/server/provider';
import { detail } from '../../src/server/queries';
import { setupDatabase } from './setup';
import type { FaultMode } from '../../src/types/domain';

setupDatabase();

async function fixture(fault: FaultMode) {
  const { id, source } = buildScenario('standard');
  await db.insert(streams).values({ id, source, fault });
  return confirmationFor(source!);
}

describe('simulated provider contract', () => {
  it('deduplicates concurrent calls with the same key', async () => {
    const payload = await fixture('none');
    await Promise.all(Array.from({ length: 10 }, () => sendEmail(payload)));
    const result = await detail(payload.reservationId);
    expect(result?.receipt?.payload).toEqual(payload);
    expect(result?.attempts.filter((item) => item.outcome === 'accepted')).toHaveLength(1);
    expect(result?.attempts.filter((item) => item.outcome === 'deduplicated')).toHaveLength(9);
  });

  it('persists acceptance before a lost response and safely retries', async () => {
    const payload = await fixture('lose_ack_once');
    await expect(sendEmail(payload)).rejects.toThrow('timeout after provider acceptance');
    expect((await detail(payload.reservationId))?.receipt).not.toBeNull();
    await sendEmail(payload);
    const result = await detail(payload.reservationId);
    expect(result?.attempts.map((item) => item.outcome)).toEqual(['response_lost', 'deduplicated']);
    expect(await db.select().from(receipts).where(eq(receipts.key, payload.key))).toHaveLength(1);
  });

  it('retries a failure before acceptance without losing the email', async () => {
    const payload = await fixture('fail_once');
    await expect(sendEmail(payload)).rejects.toThrow('unavailable');
    expect((await detail(payload.reservationId))?.receipt).toBeNull();
    await sendEmail(payload);
    expect((await detail(payload.reservationId))?.receipt).not.toBeNull();
  });

  it('rejects changing payload while reusing an idempotency key', async () => {
    const payload = await fixture('none');
    await sendEmail(payload);
    await expect(sendEmail({ ...payload, to: 'changed@example.com' })).rejects.toThrow(
      'changed payload',
    );
    expect((await detail(payload.reservationId))?.receipt?.payload.to).toBe(payload.to);
  });
});
