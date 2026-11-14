'use client';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Assumptions } from './assumptions';
import { SiteHeader } from './site-header';
import { PageTitle } from './ui/page-title';
import { cn } from '../lib/cn';

import { ArrowDownToLine, ArrowUpRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ReservationList } from './reservation-list';
import { Simulator } from './simulator';
import { ReservationInspector } from './reservation-inspector';
import { useSync } from './use-sync';
import { ErrorNotice } from './error-notice';

export function Dashboard() {
  const t = useTranslations('Dashboard');
  const format = useFormatter();

  const [selected, setSelected] = useState<string | null>(null);
  const sync = useSync(selected, setSelected);
  const [section, setSection] = useState<'overview' | 'assumptions'>('overview');
  const totals = sync.overview.data?.totals;
  const error =
    sync.simulate.error ?? sync.action.error ?? sync.overview.error ?? sync.detail.error;

  function exportResult() {
    if (!sync.detail.data) return;
    const blob = new Blob([JSON.stringify(sync.detail.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservation-${sync.detail.data.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <SiteHeader>
        <nav
          className="flex h-full items-center gap-8 max-[520px]:gap-3.5"
          aria-label={t('workspace')}
        >
          {(['overview', 'assumptions'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={section === item}
              className={cn(
                'h-full cursor-pointer border-b-2 border-transparent text-sm',
                'focus-visible:outline-2 focus-visible:outline-gold max-[520px]:text-xs',
                section === item && 'border-gold',
              )}
              onClick={() => setSection(item)}
            >
              {t(item === 'overview' ? 'reservations' : 'assumptions')}
            </button>
          ))}
        </nav>
      </SiteHeader>
      <main className="mx-auto max-w-[1480px] px-[5%] pt-[38px] max-[900px]:pt-7" id="main">
        <div
          className={cn(
            'mb-8 flex items-end justify-between gap-5 max-[900px]:flex-col',
            'max-[900px]:items-start',
          )}
        >
          <div>
            <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('eyebrow')}</p>
            <PageTitle>{t.rich('title', { accent: (chunks) => <em>{chunks}</em> })}</PageTitle>
            <p className="mt-3 text-sm text-muted">{t('description')}</p>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="secondary" onClick={() => void sync.refresh()}>
              <RefreshCw size={15} /> {t('refresh')}
            </Button>
            <Button variant="secondary" onClick={exportResult} disabled={!sync.detail.data}>
              <ArrowDownToLine size={15} /> {t('exportResult')}
            </Button>
          </div>
        </div>
        {error && <ErrorNotice error={error} onRetry={() => void sync.refresh()} />}
        {section === 'assumptions' ? (
          <Assumptions />
        ) : (
          <>
            <section
              className="mb-[30px] grid grid-cols-4 border-y border-line max-[520px]:grid-cols-2"
              aria-label={t('totals')}
            >
              {[
                { key: 'reservations', label: t('reservations'), value: totals?.reservations },
                { key: 'deliveries', label: t('deliveries'), value: totals?.deliveries },
                { key: 'duplicates', label: t('duplicates'), value: totals?.duplicates },
                { key: 'emails', label: t('emails'), value: totals?.emails },
              ].map(({ key, label, value }) => (
                <div
                  className={cn(
                    'border-l border-line px-6 py-5 first:border-l-0 first:pl-0 [&_span]:block',
                    '[&_span]:text-xs [&_span]:text-muted [&_strong]:font-display',
                    'max-[520px]:p-4 [&_strong]:text-[33px] [&_strong]:font-light',
                    'max-[520px]:nth-3:border-l-0 max-[520px]:nth-3:pl-0',
                    'max-[520px]:nth-[n+3]:border-t',
                  )}
                  key={key}
                >
                  <span>{label}</span>
                  <strong>{value === undefined ? '—' : format.number(value)}</strong>
                </div>
              ))}
            </section>
            <div
              className={cn(
                'grid grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-6',
                'max-[900px]:grid-cols-1',
              )}
            >
              <ReservationList
                reservations={sync.overview.data?.reservations ?? []}
                selected={sync.id}
                onSelect={(id) => {
                  sync.action.reset();
                  sync.simulate.reset();
                  setSelected(id);
                }}
                loading={sync.overview.isPending}
              />
              <Simulator
                pending={sync.simulate.isPending}
                onRun={(input) => {
                  sync.action.reset();
                  sync.simulate.mutate(input);
                }}
              />
            </div>
            {sync.detail.data && (
              <ReservationInspector
                data={sync.detail.data}
                pending={sync.action.isPending}
                onAction={(action) => {
                  sync.simulate.reset();
                  sync.action.mutate(action);
                }}
              />
            )}
          </>
        )}
        <footer
          className={cn(
            'mt-6 flex items-center justify-between gap-4 border-t border-line py-[30px]',
            'text-[11px] max-[520px]:flex-col max-[520px]:items-start',
          )}
        >
          <span className="tracking-wider">{t('footerTitle')}</span>
          <span className="flex items-center gap-2 text-muted">
            {t('footerNote')}
            <ArrowUpRight size={13} />
          </span>
        </footer>
      </main>
    </>
  );
}
