import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { messages } from '../../src/i18n/messages';
import { scenarioIds } from '../../src/components/scenario-options';

const t = createTranslator({
  locale: 'en',
  messages,
  onError: (error) => {
    throw error;
  },
});

describe('English message contracts', () => {
  it('formats complete singular and plural messages', () => {
    expect(t('Common.guests', { count: 1 })).toBe('1 guest');
    expect(t('Common.guests', { count: 3 })).toBe('3 guests');
    expect(t('Common.acceptedEmails', { count: 0 })).toBe('0 emails accepted');
    expect(t('Common.attempts', { count: 1 })).toBe('1 attempt');
    expect(t('ReservationInspector.waitingVersion', { version: 2 })).toBe(
      'Waiting for version 2. Later events are safely buffered.',
    );
  });

  it('keeps the styled title in one translatable sentence', () => {
    expect(t.rich('Dashboard.title', { accent: (chunks) => chunks })).toBe('Reservation sync');
    expect(t.rich('ReservationPage.title', { accent: (chunks) => chunks })).toBe(
      'Reservation details',
    );
  });

  it('provides all simulator scenarios with names, descriptions, and order', () => {
    expect(Object.keys(messages.Scenarios).sort()).toEqual([...scenarioIds].sort());
    for (const id of scenarioIds) {
      expect(t(`Scenarios.${id}.name`).length).toBeGreaterThan(0);
      expect(t(`Scenarios.${id}.description`).length).toBeGreaterThan(0);
      expect(t(`Scenarios.${id}.order`).length).toBeGreaterThan(0);
    }
  });
});
