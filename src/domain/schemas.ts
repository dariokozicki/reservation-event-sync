import { z } from 'zod';

const date = z.iso.date();
const details = {
  guestName: z.string().trim().min(1).max(100),
  guestEmail: z.email().max(254),
  property: z.string().trim().min(1).max(100),
  checkIn: date,
  checkOut: date,
  guests: z.number().int().min(1).max(12),
};

export const detailsSchema = z
  .strictObject(details)
  .refine((value) => value.checkOut > value.checkIn, {
    message: 'Check-out must be after check-in.',
    path: ['checkOut'],
  });

export const updateSchema = z
  .strictObject(details)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one change.');

const envelope = {
  eventId: z.uuid(),
  reservationId: z.uuid(),
  version: z.number().int().min(1).max(1_000_000),
  occurredAt: z.iso.datetime(),
};

export const eventSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...envelope, type: z.literal('created'), payload: detailsSchema }),
  z.strictObject({ ...envelope, type: z.literal('updated'), payload: updateSchema }),
  z.strictObject({ ...envelope, type: z.literal('confirmed'), payload: z.strictObject({}) }),
  z.strictObject({
    ...envelope,
    type: z.literal('cancelled'),
    payload: z.strictObject({ reason: z.string().trim().min(1).max(300) }),
  }),
]);

export const faultSchema = z.enum(['none', 'fail_once', 'lose_ack_once', 'always_fail']);
export const scenarioSchema = z.enum([
  'manual',
  'standard',
  'duplicates',
  'reordered',
  'gap',
  'email_retry',
  'cancelled',
  'unconfirmed_cancelled',
]);

export const simulationSchema = z.strictObject({
  scenario: scenarioSchema,
  details: detailsSchema.optional(),
});

export const appendSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('updated'), payload: updateSchema }),
  z.strictObject({ type: z.literal('confirmed'), payload: z.strictObject({}) }),
  z.strictObject({
    type: z.literal('cancelled'),
    payload: z.strictObject({ reason: z.string().trim().min(1).max(300) }),
  }),
]);
