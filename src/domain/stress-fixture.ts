import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Reservation, ReservationEvent } from '../types/domain';
import type { StressCase, StressDelivery, StressOptions, StressRun } from '../types/stress';
import { fingerprint } from './fingerprint';
import { defaultDetails } from './scenarios';

export const stressOptionsSchema = z.strictObject({
  seed: z.coerce.number().int().min(0).max(4_294_967_295).default(42),
  reservations: z.coerce.number().int().min(1).max(200).default(50),
  concurrency: z.coerce.number().int().min(1).max(32).default(8),
});

function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function makeCase(index: number): StressCase {
  const id = randomUUID();
  const details = {
    ...defaultDetails,
    guestName: `Stress guest ${index + 1}`,
    guestEmail: `stress-${index + 1}@example.test`,
  };
  const events: ReservationEvent[] = [];
  const envelope = () => ({
    eventId: randomUUID(),
    reservationId: id,
    version: events.length + 1,
    occurredAt: '2027-01-01T00:00:00.000Z',
  });
  events.push({ ...envelope(), type: 'created', payload: details });
  const expectsEmail = index % 5 !== 0;
  const reason = 'Guest changed plans.';
  let expected: Reservation;
  if (!expectsEmail) {
    events.push({ ...envelope(), type: 'cancelled', payload: { reason } });
    expected = { ...details, id, version: 2, status: 'cancelled', cancellationReason: reason };
  } else {
    events.push({ ...envelope(), type: 'updated', payload: { guests: 3 } });
    events.push({ ...envelope(), type: 'confirmed', payload: {} });
    if (index % 3 === 0) {
      events.push({ ...envelope(), type: 'cancelled', payload: { reason } });
      expected = {
        ...details,
        id,
        version: 4,
        guests: 3,
        status: 'cancelled',
        cancellationReason: reason,
      };
    } else {
      events.push({ ...envelope(), type: 'updated', payload: { guests: 5 } });
      expected = { ...details, id, version: 4, guests: 5, status: 'confirmed' };
    }
  }
  const fault = index % 7 === 0 ? 'lose_ack_once' : index % 11 === 0 ? 'fail_once' : 'none';
  return { id, events, expected, expectsEmail, fault };
}

export function buildStressRun(raw: StressOptions): StressRun {
  const options = stressOptionsSchema.parse(raw);
  const random = randomFrom(options.seed);
  const cases = Array.from({ length: options.reservations }, (_, index) => makeCase(index));
  const deliveries: StressDelivery[] = [];
  cases.forEach((item, caseIndex) => {
    item.events.forEach((event) => {
      const copies = 2 + Math.floor(random() * 3);
      for (let copy = 0; copy < copies; copy++) {
        deliveries.push({ caseIndex, version: event.version, event });
      }
    });
  });
  for (let index = deliveries.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deliveries[index], deliveries[other]] = [deliveries[other], deliveries[index]];
  }
  const planHash = fingerprint(
    deliveries.map(({ caseIndex, version }) => ({ caseIndex, version })),
  );
  return { cases, deliveries, planHash };
}
