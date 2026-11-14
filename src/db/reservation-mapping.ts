import type { ReservationRow } from '../types/database';
import type { Reservation } from '../types/domain';

export function toReservation(row: ReservationRow | null | undefined): Reservation | null {
  if (!row) return null;
  const { cancellationReason, ...details } = row;
  return cancellationReason === null ? details : { ...details, cancellationReason };
}
