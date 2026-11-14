import type { FaultMode, Reservation, ReservationEvent, SyncResult } from './domain';

export type StressOptions = { seed: number; reservations: number; concurrency: number };
export type StressCase = {
  id: string;
  events: ReservationEvent[];
  expected: Reservation;
  expectsEmail: boolean;
  fault: FaultMode;
};
export type StressDelivery = { caseIndex: number; version: number; event: ReservationEvent };
export type StressRun = { cases: StressCase[]; deliveries: StressDelivery[]; planHash: string };
export type StressMismatch = { reservationId: string; checks: string[] };
export type StressReport = {
  passed: boolean;
  options: StressOptions;
  planHash: string;
  totals: {
    reservations: number;
    uniqueEvents: number;
    deliveries: number;
    duplicates: number;
    expectedEmails: number;
    acceptedEmails: number;
    emailAttempts: number;
    conflicts: number;
    blocked: number;
  };
  timingsMs: { ingest: number; total: number };
  mismatches: StressMismatch[];
};
export type StressOutcomeCounts = Record<SyncResult['outcome'], number>;
