import type { z } from 'zod';
import type {
  appendSchema,
  detailsSchema,
  eventSchema,
  faultSchema,
  scenarioSchema,
} from '../domain/schemas';

export type ReservationDetails = z.infer<typeof detailsSchema>;
export type ReservationEvent = z.infer<typeof eventSchema>;
export type EventChange = z.infer<typeof appendSchema>;
export type FaultMode = z.infer<typeof faultSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type Reservation = ReservationDetails & {
  id: string;
  version: number;
  status: ReservationStatus;
  cancellationReason?: string;
};

export type EmailPayload = {
  key: string;
  reservationId: string;
  to: string;
  subject: string;
  body: string;
  reservationUrl?: string;
};

export type SyncResult = {
  outcome: 'applied' | 'buffered' | 'duplicate' | 'conflict' | 'blocked';
  appliedVersions: number[];
  message: string;
};
