import type { Reservation, ReservationEvent } from '../types/domain';
import { DomainError } from './errors';
import { stateFor } from './reservation-states';

export { DomainError } from './errors';

export function applyEvent(current: Reservation | null, event: ReservationEvent): Reservation {
  if (event.version !== (current?.version ?? 0) + 1) {
    throw new DomainError('Event is not the next consecutive version.');
  }
  if (current && current.id !== event.reservationId) {
    throw new DomainError('Event belongs to a different reservation.');
  }
  const state = stateFor(current);
  switch (event.type) {
    case 'created':
      return state.created(event);
    case 'updated':
      return state.updated(event);
    case 'confirmed':
      return state.confirmed(event);
    case 'cancelled':
      return state.cancelled(event);
  }
}
