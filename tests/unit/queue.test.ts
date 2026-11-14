import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fake } = vi.hoisted(() => ({
  fake: { on: vi.fn(), start: vi.fn(), createQueue: vi.fn(), stop: vi.fn() },
}));

vi.mock('pg-boss', () => ({
  PgBoss: class {
    on = fake.on;
    start = fake.start;
    createQueue = fake.createQueue;
    stop = fake.stop;
  },
}));

import { getBoss, stopBoss } from '../../src/server/queue';

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://unused/unit-test');
  fake.on.mockReset();
  fake.start.mockReset().mockResolvedValue(undefined);
  fake.createQueue.mockReset().mockResolvedValue(undefined);
  fake.stop.mockReset().mockResolvedValue(undefined);
});

afterEach(async () => {
  await stopBoss();
  vi.unstubAllEnvs();
});

describe('queue initialization lifecycle', () => {
  it('shares initialization across concurrent requests', async () => {
    const first = getBoss();
    const second = getBoss();
    expect(first).toBe(second);
    await Promise.all([first, second]);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('cleans up a partially started queue and permits a later retry', async () => {
    const failure = new Error('Queue creation failed.');
    fake.createQueue.mockRejectedValueOnce(failure);
    await expect(getBoss()).rejects.toBe(failure);
    expect(fake.stop).toHaveBeenCalledTimes(1);
    await getBoss();
    expect(fake.start).toHaveBeenCalledTimes(2);
  });

  it('preserves the original setup error when cleanup also fails', async () => {
    const failure = new Error('Start failed.');
    fake.start.mockRejectedValueOnce(failure);
    fake.stop.mockRejectedValueOnce(new Error('Cleanup failed.'));
    await expect(getBoss()).rejects.toBe(failure);
    expect(fake.stop).toHaveBeenCalledTimes(1);
  });
});
