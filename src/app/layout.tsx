import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ChildrenProps } from '../types/ui';
import { QueryProvider } from '../components/query-provider';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Common');
  return { title: t('appTitle'), description: t('appDescription') };
}

export default async function RootLayout({ children }: ChildrenProps) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="bg-paper font-sans text-ink antialiased">
        <NextIntlClientProvider>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
