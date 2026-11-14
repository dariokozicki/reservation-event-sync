import { eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { confirmations } from '../src/db/schema';
import { fingerprint } from '../src/domain/fingerprint';
import { detail } from '../src/server/queries';
import type { StressCase, StressMismatch } from '../src/types/stress';

export async function waitForEmails(cases: StressCase[]) {
  const expected = cases.filter((item) => item.expectsEmail);
  const timeoutMs = Math.max(120_000, expected.length * 2_000 + 30_000);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const statuses = await Promise.all(
      expected.map(async (item) => {
        const email = await db.query.confirmations.findFirst({
          where: eq(confirmations.reservationId, item.id),
        });
        return email?.status;
      }),
    );
    if (statuses.every((status) => status === 'delivered' || status === 'failed')) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export async function verifyStress(cases: StressCase[]) {
  const mismatches: StressMismatch[] = [];
  let acceptedEmails = 0;
  let emailAttempts = 0;
  for (const item of cases) {
    const actual = await detail(item.id);
    const checks: string[] = [];
    if (!actual) {
      mismatches.push({ reservationId: item.id, checks: ['Reservation missing.'] });
      continue;
    }
    if (fingerprint(actual.local) !== fingerprint(item.expected)) checks.push('State differs.');
    if (actual.inbox.length !== item.events.length) checks.push('Unique inbox count differs.');
    if (actual.inbox.some((entry) => entry.state !== 'applied')) checks.push('Unapplied events.');
    if (actual.receipt) acceptedEmails++;
    emailAttempts += actual.attempts.length;
    if (item.expectsEmail) {
      if (actual.confirmation?.status !== 'delivered') checks.push('Email not delivered.');
      if (!actual.receipt) checks.push('Provider receipt missing.');
      if (actual.receipt?.payload.to !== item.expected.guestEmail) checks.push('Wrong recipient.');
      if (!actual.receipt?.payload.body.includes('Guests: 3\n')) {
        checks.push('Confirmation details were not frozen at v3.');
      }
      if (actual.receipt?.payload.key !== `reservation-confirmation:${item.id}`) {
        checks.push('Wrong idempotency key.');
      }
      if (
        actual.attempts.filter(
          (entry) => entry.outcome === 'accepted' || entry.outcome === 'response_lost',
        ).length !== 1
      ) {
        checks.push('Provider acceptance count differs from one.');
      }
    } else if (actual.confirmation || actual.receipt || actual.attempts.length) {
      checks.push('Unconfirmed reservation caused email activity.');
    }
    if (checks.length) mismatches.push({ reservationId: item.id, checks });
  }
  return { mismatches, acceptedEmails, emailAttempts };
}
