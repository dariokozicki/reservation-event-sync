import type { Reservation, ReservationEvent } from './domain';

export type CreatedEvent = Extract<ReservationEvent, { type: 'created' }>;
export type UpdatedEvent = Extract<ReservationEvent, { type: 'updated' }>;
export type ConfirmedEvent = Extract<ReservationEvent, { type: 'confirmed' }>;
export type CancelledEvent = Extract<ReservationEvent, { type: 'cancelled' }>;

export interface ReservationState {
  created(event: CreatedEvent): Reservation;
  updated(event: UpdatedEvent): Reservation;
  confirmed(event: ConfirmedEvent): Reservation;
  cancelled(event: CancelledEvent): Reservation;
}
