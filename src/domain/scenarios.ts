import { randomUUID } from 'node:crypto';
import { applyEvent } from './reservation';
import type {
  FaultMode,
  Reservation,
  ReservationDetails,
  ReservationEvent,
  Scenario,
} from '../types/domain';

export const defaultDetails: ReservationDetails = {
  guestName: 'Alex Morgan',
  guestEmail: 'alex@example.com',
  property: 'Parkline · The Loop',
  checkIn: '2027-02-12',
  checkOut: '2027-02-16',
  guests: 2,
};

export function buildScenario(scenario: Scenario, details = defaultDetails) {
  const id = randomUUID();
  const events: ReservationEvent[] = [];
  const base = () => ({
    eventId: randomUUID(),
    reservationId: id,
    version: events.length + 1,
    occurredAt: new Date().toISOString(),
  });
  events.push({ ...base(), type: 'created', payload: details });
  if (scenario === 'unconfirmed_cancelled') {
    events.push({ ...base(), type: 'cancelled', payload: { reason: 'Guest changed plans.' } });
  } else if (scenario !== 'manual') {
    events.push({ ...base(), type: 'updated', payload: { guests: 3 } });
    events.push({ ...base(), type: 'confirmed', payload: {} });
    if (scenario === 'cancelled') {
      events.push({ ...base(), type: 'cancelled', payload: { reason: 'Guest changed plans.' } });
    }
  }
  let source: Reservation | null = null;
  for (const event of events) source = applyEvent(source, event);
  const orders: Record<Scenario, number[]> = {
    manual: [0],
    standard: [0, 1, 2],
    duplicates: [0, 0, 1, 2, 2, 1],
    reordered: [2, 1, 0],
    gap: [0, 2],
    email_retry: [0, 1, 2],
    cancelled: [3, 2, 0, 1],
    unconfirmed_cancelled: [1, 0],
  };
  const fault: FaultMode = scenario === 'email_retry' ? 'lose_ack_once' : 'none';
  return { id, events, source, order: orders[scenario], fault };
}
