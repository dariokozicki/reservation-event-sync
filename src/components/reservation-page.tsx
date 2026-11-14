'use client';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { SiteHeader } from './site-header';
import { PageTitle } from './ui/page-title';
import { cn } from '../lib/cn';

import Link from 'next/link';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { InspectorTab, ReservationPageProps } from '../types/ui';
import { useReservation } from './use-reservation';
import { ReservationInspector } from './reservation-inspector';
import { ReservationSummary } from './reservation-summary';
import { ErrorNotice } from './error-notice';

export function ReservationPage({ id }: ReservationPageProps) {
  const t = useTranslations('ReservationPage');

  const { detail, action, refresh } = useReservation(id);
  const error = detail.error ?? action.error;
  const [copyMessage, setCopyMessage] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: InspectorTab =
    requestedTab === 'state' || requestedTab === 'email' ? requestedTab : 'events';
  const changeTab = (next: InspectorTab) => {
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage(t('copied'));
    } catch {
      setCopyMessage(t('copyFallback'));
    }
  };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1480px] px-[5%] pt-[38px] max-[900px]:pt-7" id="main">
        <Link className="mb-7 inline-flex items-center gap-2 text-sm text-muted" href="/">
          <ArrowLeft size={16} /> {t('allReservations')}
        </Link>
        <div
          className={cn(
            'mb-8 flex items-end justify-between gap-5 max-[900px]:flex-col',
            'max-[900px]:items-start',
          )}
        >
          <div>
            <p className="mb-2 text-[10px] tracking-[2px] text-muted">
              {t('reference', { id: id.slice(0, 8).toUpperCase() })}
            </p>
            <PageTitle>{t.rich('title', { accent: (chunks) => <em>{chunks}</em> })}</PageTitle>
            <p className="mt-3 text-sm text-muted">{t('description')}</p>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="secondary" onClick={() => void refresh()}>
              <RefreshCw size={15} /> {t('refresh')}
            </Button>
            <Button variant="secondary" onClick={() => void copyLink()}>
              <Copy size={15} /> {t('copyLink')}
            </Button>
          </div>
        </div>
        <p className="-mt-3 min-h-[18px] text-xs" role="status">
          {copyMessage}
        </p>
        {error && <ErrorNotice error={error} onRetry={() => void refresh()} />}
        {detail.isPending && <p role="status">{t('loadingReservation')}</p>}
        {detail.data && (
          <>
            <ReservationSummary data={detail.data} />
            <ReservationInspector
              data={detail.data}
              pending={action.isPending}
              onAction={(input) => action.mutate(input)}
              tab={tab}
              onTabChange={changeTab}
              standalone
            />
            <p className="mt-7 max-w-[760px] text-xs text-muted">{t('accessNote')}</p>
          </>
        )}
      </main>
    </>
  );
}
