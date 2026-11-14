import { describe, expect, it } from 'vitest';
import { applyEvent, DomainError } from '../../src/domain/reservation';
import { buildScenario } from '../../src/domain/scenarios';

describe('reservation state boundaries', () => {
  it.each(['updated', 'confirmed', 'cancelled'] as const)(
    'requires creation before %s even when the version is consecutive',
    (type) => {
      const event = buildScenario('cancelled').events.find((item) => item.type === type)!;
      expect(() => applyEvent(null, { ...event, version: 1 })).toThrow(
        new DomainError('Creation must precede other events.'),
      );
    },
  );

  it.each(['standard', 'cancelled'] as const)('rejects recreation after %s', (scenario) => {
    const { source, events } = buildScenario(scenario);
    expect(() => applyEvent(source, { ...events[0], version: source!.version + 1 })).toThrow(
      'Reservation already exists.',
    );
  });

  it.each(['updated', 'confirmed', 'cancelled'] as const)(
    'rejects %s after cancellation',
    (type) => {
      const { source, events } = buildScenario('cancelled');
      const event = events.find((item) => item.type === type)!;
      expect(() => applyEvent(source, { ...event, version: source!.version + 1 })).toThrow(
        'Cancelled reservations cannot change.',
      );
    },
  );

  it('allows updates after confirmation without mutating the previous snapshot', () => {
    const { source, events } = buildScenario('standard');
    const before = structuredClone(source);
    const updated = applyEvent(source, {
      ...events[1],
      version: source!.version + 1,
      type: 'updated',
      payload: { guests: 5 },
    });
    expect(updated).toMatchObject({ status: 'confirmed', version: 4, guests: 5 });
    expect(source).toEqual(before);
    expect(updated).not.toBe(source);
  });

  it('allows a pending reservation to cancel without confirmation', () => {
    const { events } = buildScenario('cancelled');
    const pending = applyEvent(null, events[0]);
    const cancellation = events.find((event) => event.type === 'cancelled')!;
    const cancelled = applyEvent(pending, { ...cancellation, version: 2 });
    expect(cancelled).toMatchObject({ status: 'cancelled', version: 2 });
    expect(pending.status).toBe('pending');
  });
});
