import { beforeAll, describe, expect, it } from 'vitest';
import { startEmailWorker } from '../../src/server/email-worker';
import { detail } from '../../src/server/queries';
import {
  appendSourceEvent,
  retryEmail,
  setProviderFault,
  simulate,
} from '../../src/server/simulator';
import { setupDatabase } from './setup';

setupDatabase();
beforeAll(async () => {
  await startEmailWorker();
});

describe('pg-boss delivery', () => {
  it('recovers an accepted email with a lost response using the same receipt', async () => {
    const { id } = await simulate({ scenario: 'email_retry' });
    await expect
      .poll(async () => (await detail(id))?.confirmation?.status, {
        timeout: 20_000,
        interval: 200,
      })
      .toBe('delivered');
    const result = await detail(id);
    expect(result?.attempts.map((item) => item.outcome)).toEqual(['response_lost', 'deduplicated']);
    expect(result?.receipt).not.toBeNull();
  });

  it('exposes exhausted retries and allows recovery with the original key', async () => {
    const { id } = await simulate({ scenario: 'manual' });
    await setProviderFault(id, 'always_fail');
    await appendSourceEvent(id, { type: 'confirmed', payload: {} });
    await expect
      .poll(async () => (await detail(id))?.confirmation?.status, {
        timeout: 45_000,
        interval: 250,
      })
      .toBe('failed');
    const before = await detail(id);
    expect(before?.receipt).toBeNull();
    expect(before?.attempts).toHaveLength(4);
    await setProviderFault(id, 'none');
    await retryEmail(id);
    await expect
      .poll(async () => (await detail(id))?.confirmation?.status, {
        timeout: 10_000,
        interval: 200,
      })
      .toBe('delivered');
    const after = await detail(id);
    expect(after?.confirmation?.payload).toEqual(before?.confirmation?.payload);
    expect(after?.receipt).not.toBeNull();
  });
});
