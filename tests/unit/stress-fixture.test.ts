import { describe, expect, it } from 'vitest';
import { buildStressRun, stressOptionsSchema } from '../../src/domain/stress-fixture';

describe('repeatable stress inputs', () => {
  const options = { seed: 42, reservations: 50, concurrency: 8 };

  it('reproduces the delivery plan with fresh reservation identities', () => {
    const first = buildStressRun(options);
    const second = buildStressRun(options);
    expect(first.planHash).toBe(second.planHash);
    expect(first.cases[0].id).not.toBe(second.cases[0].id);
    expect(buildStressRun({ ...options, seed: 43 }).planHash).not.toBe(first.planHash);
  });

  it('covers every source event with 2–4 copies and both email/no-email histories', () => {
    const run = buildStressRun(options);
    for (const item of run.cases) {
      for (const event of item.events) {
        const copies = run.deliveries.filter(
          (delivery) => delivery.event.eventId === event.eventId,
        );
        expect(copies.length).toBeGreaterThanOrEqual(2);
        expect(copies.length).toBeLessThanOrEqual(4);
      }
    }
    expect(run.cases.filter((item) => item.expectsEmail)).toHaveLength(40);
    expect(run.cases.some((item) => item.fault === 'lose_ack_once')).toBe(true);
    expect(run.cases.some((item) => item.fault === 'fail_once')).toBe(true);
    expect(
      run.deliveries.some(
        (item, index) =>
          item.version > 1 &&
          !run.deliveries
            .slice(0, index)
            .some((earlier) => earlier.caseIndex === item.caseIndex && earlier.version === 1),
      ),
    ).toBe(true);
  });

  it('bounds work and rejects invalid seeds/concurrency', () => {
    expect(stressOptionsSchema.parse({})).toEqual(options);
    expect(stressOptionsSchema.safeParse({ reservations: 201 }).success).toBe(false);
    expect(stressOptionsSchema.safeParse({ concurrency: 0 }).success).toBe(false);
    expect(stressOptionsSchema.safeParse({ seed: 'bad' }).success).toBe(false);
  });
});
