import type { Reservation, ReservationStatus } from '../types/domain';
import type {
  CancelledEvent,
  ConfirmedEvent,
  CreatedEvent,
  ReservationState,
  UpdatedEvent,
} from '../types/reservation-state';
import { DomainError } from './errors';
import { detailsSchema } from './schemas';

class AwaitingCreationState implements ReservationState {
  created(event: CreatedEvent): Reservation {
    return {
      ...event.payload,
      id: event.reservationId,
      version: event.version,
      status: 'pending',
    };
  }

  updated(): never {
    throw new DomainError('Creation must precede other events.');
  }

  confirmed(): never {
    throw new DomainError('Creation must precede other events.');
  }

  cancelled(): never {
    throw new DomainError('Creation must precede other events.');
  }
}

abstract class ExistingReservationState implements ReservationState {
  constructor(protected readonly current: Reservation) {}

  created(): never {
    throw new DomainError('Reservation already exists.');
  }

  updated(event: UpdatedEvent): Reservation {
    const merged = { ...this.current, ...event.payload };
    const checked = detailsSchema.safeParse({
      guestName: merged.guestName,
      guestEmail: merged.guestEmail,
      property: merged.property,
      checkIn: merged.checkIn,
      checkOut: merged.checkOut,
      guests: merged.guests,
    });
    if (!checked.success) throw new DomainError(checked.error.issues[0].message);
    return { ...this.current, ...checked.data, version: event.version };
  }

  cancelled(event: CancelledEvent): Reservation {
    return {
      ...this.current,
      version: event.version,
      status: 'cancelled',
      cancellationReason: event.payload.reason,
    };
  }

  abstract confirmed(event: ConfirmedEvent): Reservation;
}

class PendingState extends ExistingReservationState {
  confirmed(event: ConfirmedEvent): Reservation {
    return { ...this.current, version: event.version, status: 'confirmed' };
  }
}

class ConfirmedState extends ExistingReservationState {
  confirmed(): never {
    throw new DomainError('Only pending reservations can be confirmed.');
  }
}

class CancelledState extends ExistingReservationState {
  updated(): never {
    throw new DomainError('Cancelled reservations cannot change.');
  }

  confirmed(): never {
    throw new DomainError('Cancelled reservations cannot change.');
  }

  cancelled(): never {
    throw new DomainError('Cancelled reservations cannot change.');
  }
}

const states = {
  pending: PendingState,
  confirmed: ConfirmedState,
  cancelled: CancelledState,
} satisfies Record<ReservationStatus, new (current: Reservation) => ReservationState>;

export function stateFor(current: Reservation | null): ReservationState {
  return current ? new states[current.status](current) : new AwaitingCreationState();
}
