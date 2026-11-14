import type { EmailPayload, FaultMode, Reservation, ReservationEvent } from './domain';

export type StreamSummary = {
  id: string;
  scenario: string;
  source: Reservation | null;
  local: Reservation | null;
  fault: FaultMode;
  createdAt: string;
};

export type InboxEntry = {
  id: string;
  version: number;
  event: ReservationEvent;
  state: 'applied' | 'buffered' | 'blocked';
  error: string | null;
  receivedAt: string;
  appliedAt: string | null;
};

export type Delivery = {
  id: string;
  eventId: string;
  version: number;
  outcome: string;
  message: string;
  receivedAt: string;
};

export type Confirmation = {
  payload: EmailPayload;
  status: 'pending' | 'retrying' | 'delivered' | 'failed';
  lastError: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

export type EmailAttempt = {
  id: string;
  outcome: string;
  message: string;
  createdAt: string;
};

export type ReservationDetail = StreamSummary & {
  events: { id: string; version: number; event: ReservationEvent }[];
  inbox: InboxEntry[];
  deliveries: Delivery[];
  confirmation: Confirmation | null;
  receipt: { payload: EmailPayload; acceptedAt: string } | null;
  attempts: EmailAttempt[];
};

export type Overview = {
  reservations: StreamSummary[];
  totals: { reservations: number; deliveries: number; duplicates: number; emails: number };
};

export type RouteContext = { params: Promise<{ id: string }> };
