import type { db } from '../db/client';
import type { reservations } from '../db/schema';

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type ReservationRow = typeof reservations.$inferSelect;
