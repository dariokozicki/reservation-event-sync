import type { messages } from '../i18n/messages';

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en';
    Messages: typeof messages;
  }
}
