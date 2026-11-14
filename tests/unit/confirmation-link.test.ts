import { describe, expect, it } from 'vitest';
import { confirmationFor } from '../../src/domain/confirmation';

import { buildScenario } from '../../src/domain/scenarios';

describe('confirmation reservation links', () => {
  it('includes an absolute link in the default email body and payload', () => {
    const reservation = buildScenario('standard').source!;
    const email = confirmationFor(reservation);
    expect(email.reservationUrl).toBe(`http://localhost:3000/reservations/${reservation.id}`);
    expect(email.body).toContain(`View your reservation: ${email.reservationUrl}`);
  });

  it('uses the configured public host and port', () => {
    const reservation = buildScenario('standard').source!;
    const email = confirmationFor(reservation, 'https://reservations.example.test:8443/');
    expect(email.reservationUrl).toBe(
      `https://reservations.example.test:8443/reservations/${reservation.id}`,
    );
  });

  it('rejects non-web link protocols', () => {
    const reservation = buildScenario('standard').source!;
    expect(() => confirmationFor(reservation, 'ftp://example.test')).toThrow('http or https');
  });
});
