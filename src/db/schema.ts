import { sql } from 'drizzle-orm';
import {
  check,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  EmailPayload,
  FaultMode,
  Reservation,
  ReservationEvent,
  ReservationStatus,
} from '../types/domain';

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

export const streams = pgTable('streams', {
  id: uuid('id').primaryKey(),
  scenario: text('scenario').notNull().default('external'),
  source: jsonb('source').$type<Reservation>(),
  fault: text('fault').$type<FaultMode>().notNull().default('none'),
  createdAt: createdAt(),
});

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => streams.id),
    version: integer('version').notNull(),
    status: text('status').$type<ReservationStatus>().notNull(),
    guestName: text('guest_name').notNull(),
    guestEmail: text('guest_email').notNull(),
    property: text('property').notNull(),
    checkIn: date('check_in', { mode: 'string' }).notNull(),
    checkOut: date('check_out', { mode: 'string' }).notNull(),
    guests: integer('guests').notNull(),
    cancellationReason: text('cancellation_reason'),
  },
  (table) => [
    check('reservation_version_positive', sql`${table.version} >= 1`),
    check(
      'reservation_status_valid',
      sql`${table.status} in ('pending', 'confirmed', 'cancelled')`,
    ),
    check('reservation_guest_count_valid', sql`${table.guests} between 1 and 12`),
    check('reservation_dates_valid', sql`${table.checkOut} > ${table.checkIn}`),
  ],
);

export const sourceEvents = pgTable(
  'source_events',
  {
    id: uuid('id').primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => streams.id),
    version: integer('version').notNull(),
    event: jsonb('event').$type<ReservationEvent>().notNull(),
  },
  (table) => [uniqueIndex('source_reservation_version').on(table.reservationId, table.version)],
);

export const inbox = pgTable(
  'inbox',
  {
    id: uuid('id').primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => streams.id),
    version: integer('version').notNull(),
    event: jsonb('event').$type<ReservationEvent>().notNull(),
    hash: text('hash').notNull(),
    state: text('state').$type<'buffered' | 'applied' | 'blocked'>().notNull(),
    error: text('error'),
    receivedAt: createdAt(),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('inbox_reservation_version').on(table.reservationId, table.version)],
);

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  reservationId: uuid('reservation_id')
    .notNull()
    .references(() => streams.id),
  eventId: uuid('event_id').notNull(),
  version: integer('version').notNull(),
  outcome: text('outcome').notNull(),
  message: text('message').notNull(),
  receivedAt: createdAt(),
});

export const confirmations = pgTable('confirmations', {
  reservationId: uuid('reservation_id')
    .primaryKey()
    .references(() => streams.id),
  key: text('key').notNull().unique(),
  payload: jsonb('payload').$type<EmailPayload>().notNull(),
  jobId: uuid('job_id').notNull(),
  status: text('status').$type<'pending' | 'retrying' | 'delivered' | 'failed'>().notNull(),
  lastError: text('last_error'),
  createdAt: createdAt(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});

export const receipts = pgTable('provider_receipts', {
  key: text('key').primaryKey(),
  reservationId: uuid('reservation_id')
    .notNull()
    .references(() => streams.id),
  payload: jsonb('payload').$type<EmailPayload>().notNull(),
  hash: text('hash').notNull(),
  acceptedAt: createdAt(),
});

export const attempts = pgTable('email_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  reservationId: uuid('reservation_id')
    .notNull()
    .references(() => streams.id),
  outcome: text('outcome').notNull(),
  message: text('message').notNull(),
  createdAt: createdAt(),
});
