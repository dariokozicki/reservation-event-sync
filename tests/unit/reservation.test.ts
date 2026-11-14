import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { confirmationFor } from '../../src/domain/confirmation';
import { applyEvent } from '../../src/domain/reservation';
import { buildScenario } from '../../src/domain/scenarios';
import { detailsSchema, eventSchema } from '../../src/domain/schemas';
import { fingerprint } from '../../src/domain/fingerprint';

describe('reservation lifecycle', () => {
  it('creates pending, applies updates, then confirms with updated details', () => {
    const { events } = buildScenario('standard');
    const created = applyEvent(null, events[0]);
    expect(created.status).toBe('pending');
    const updated = applyEvent(created, events[1]);
    const confirmed = applyEvent(updated, events[2]);
    expect(confirmed).toMatchObject({ status: 'confirmed', guests: 3, version: 3 });
    expect(confirmationFor(confirmed).body).toContain('Guests: 3');
  });

  it('does not infer payment status from confirmation', () => {
    const { source } = buildScenario('standard');
    expect(source).not.toHaveProperty('paymentStatus');
  });

  it('rejects out-of-sequence application and cross-reservation events', () => {
    const { events } = buildScenario('standard');
    expect(() => applyEvent(null, events[2])).toThrow('consecutive');
    const created = applyEvent(null, events[0]);
    expect(() => applyEvent(created, { ...events[1], reservationId: randomUUID() })).toThrow(
      'different reservation',
    );
  });

  it('cancellation is terminal and a repeated confirmation is not a new transition', () => {
    const { events, source } = buildScenario('cancelled');
    expect(source?.status).toBe('cancelled');
    expect(() => applyEvent(source, { ...events[1], version: 5 })).toThrow('cannot change');
    const confirmed = buildScenario('standard').source;
    expect(() =>
      applyEvent(confirmed, {
        ...events[2],
        reservationId: confirmed!.id,
        version: 4,
      }),
    ).toThrow('Only pending');
  });

  it('validates the resulting dates after a partial update', () => {
    const { events } = buildScenario('standard');
    const created = applyEvent(null, events[0]);
    expect(() =>
      applyEvent(created, {
        ...events[1],
        type: 'updated',
        payload: { checkIn: '2028-01-01' },
      }),
    ).toThrow('Check-out must be after check-in');
  });
});

describe('contracts', () => {
  it('rejects invalid emails, impossible dates, unknown keys, and empty updates', () => {
    const event = buildScenario('standard').events[0];
    expect(eventSchema.safeParse({ ...event, extra: true }).success).toBe(false);
    expect(eventSchema.safeParse({ ...event, version: 0 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...event, type: 'updated', payload: {} }).success).toBe(false);
    if (event.type !== 'created') throw new Error('Fixture must start with creation.');
    expect(detailsSchema.safeParse({ ...event.payload, guestEmail: 'invalid' }).success).toBe(
      false,
    );
    expect(detailsSchema.safeParse({ ...event.payload, checkIn: '2027-02-30' }).success).toBe(
      false,
    );
  });

  it('fingerprints JSON independently of object key order', () => {
    expect(fingerprint({ b: 1, a: { y: 3, x: 2 } })).toBe(fingerprint({ a: { x: 2, y: 3 }, b: 1 }));
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
  });
});
