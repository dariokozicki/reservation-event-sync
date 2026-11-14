import type { Reservation } from '../types/domain';
import type { SyncView } from '../types/ui';

export const reservationFields = [
  'version',
  'status',
  'guestName',
  'guestEmail',
  'property',
  'checkIn',
  'checkOut',
  'guests',
  'cancellationReason',
] as const satisfies readonly (keyof Reservation)[];

export function differingFields(source: Reservation | null, local: Reservation | null) {
  return reservationFields.filter((key) => source?.[key] !== local?.[key]);
}

export function synchronizationStatus({ source, local, inbox = [] }: SyncView) {
  if (inbox.some((event) => event.state === 'blocked')) return 'blocked';
  if (inbox.some((event) => event.state === 'buffered')) return 'waiting';
  if (!source) return 'unavailable';
  if (!local || local.version < source.version) return 'catching_up';
  return differingFields(source, local).length === 0 ? 'synced' : 'diverged';
}
