import { createTranslator } from 'next-intl';
import emailTemplate from '../i18n/en/email-template';
import type { EmailPayload, Reservation } from '../types/domain';

const t = createTranslator({ locale: 'en', messages: emailTemplate });

export function confirmationFor(
  reservation: Reservation,
  baseUrl = 'http://localhost:3000',
): EmailPayload {
  const url = new URL(`/reservations/${reservation.id}`, baseUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('APP_BASE_URL must use http or https.');
  }
  const reservationUrl = url.toString();
  return {
    key: `reservation-confirmation:${reservation.id}`,
    reservationId: reservation.id,
    to: reservation.guestEmail,
    subject: t('subject', { property: reservation.property }),
    reservationUrl,
    body: [
      t('greeting', { guestName: reservation.guestName }),
      '',
      t('confirmed', { property: reservation.property }),
      t('checkIn', { date: reservation.checkIn }),
      t('checkOut', { date: reservation.checkOut }),
      t('guests', { count: reservation.guests }),
      '',
      t('link', { url: reservationUrl }),
      '',
      t('signature'),
    ].join('\n'),
  };
}
