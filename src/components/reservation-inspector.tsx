import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '../lib/cn';
import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';
import type { InspectorProps, InspectorTab } from '../types/ui';
import { Badge } from './badge';
import { StateComparison } from './state-comparison';
import { EventHistory } from './event-history';
import { EmailPanel } from './email-panel';
import { ReservationControls } from './reservation-controls';

const tabs = ['events', 'state', 'email'] as const;

export function ReservationInspector({
  data,
  pending,
  onAction,
  tab: selectedTab,
  onTabChange,
  standalone,
}: InspectorProps) {
  const t = useTranslations('ReservationInspector');
  const common = useTranslations('Common');
  const format = useFormatter();

  const [localTab, setLocalTab] = useState<InspectorTab>('events');
  const tab = selectedTab ?? localTab;
  const setTab = (next: InspectorTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  const state = data.local ?? data.source;
  const blocked = data.inbox.find((event) => event.state === 'blocked');
  const waiting = data.inbox.some((event) => event.state === 'buffered');
  return (
    <section
      className="mt-6 overflow-hidden rounded-lg border border-line bg-surface"
      aria-label={t('reservationDetails')}
    >
      <div
        className={cn(
          'flex justify-between gap-6 p-[26px] max-[900px]:flex-col',
          'max-[680px]:px-[18px] [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3',
        )}
      >
        <div>
          <p className="mb-2 text-[10px] tracking-[2px] text-muted">
            {common('reservationId', { id: data.id.slice(0, 8).toUpperCase() })}
          </p>
          {!standalone && (
            <Link
              className="mb-2.5 inline-block text-[13px] text-ink underline underline-offset-4"
              href={`/reservations/${data.id}`}
            >
              {t('openReservationPage')}
            </Link>
          )}
          <h2 className="font-display text-[25px] font-normal tracking-[-0.4px]">
            {state?.guestName ?? t('awaitingCreation')}{' '}
            <Badge value={data.local?.status ?? 'buffered'} />
          </h2>
          <div
            className={cn(
              'mt-2.5 flex flex-wrap gap-4 text-xs text-muted [&_span]:flex',
              '[&_span]:items-center [&_span]:gap-1.5',
            )}
          >
            <span>{state?.property}</span>
            {state && (
              <>
                <span>
                  <CalendarDays size={14} />
                  {format.dateTime(new Date(state.checkIn), { dateStyle: 'medium' })} —{' '}
                  {format.dateTime(new Date(state.checkOut), { dateStyle: 'medium' })}
                </span>
                <span>
                  <Users size={14} /> {common('guests', { count: state.guests })}
                </span>
              </>
            )}
          </div>
        </div>
        <ReservationControls key={data.id} data={data} onAction={onAction} pending={pending} />
      </div>
      {blocked ? (
        <div className="bg-warning-soft px-[26px] py-3 text-[13px] text-warning" role="status">
          {t('blockedVersion', { version: blocked.version, reason: blocked.error ?? '' })}
        </div>
      ) : (
        waiting && (
          <div className="bg-warning-soft px-[26px] py-3 text-[13px] text-warning" role="status">
            {t('waitingVersion', { version: (data.local?.version ?? 0) + 1 })}
          </div>
        )
      )}
      <div
        className={cn(
          'flex gap-7 overflow-x-auto border-b border-line px-[26px]',
          'max-[680px]:gap-[18px] max-[680px]:px-[18px] [&_button]:whitespace-nowrap',
          '[&_button]:border-b-2 [&_button]:border-transparent [&_button]:py-4',
          '[&_button]:text-[13px] [&_button[aria-selected=true]]:border-gold',
          '[&_button[aria-selected=true]]:text-gold',
        )}
        role="tablist"
        aria-label={t('reservationInspection')}
      >
        {tabs.map((item, index) => (
          <button
            className={cn(
              'cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-50',
              'focus-visible:outline-2 focus-visible:outline-offset-4',
              'focus-visible:outline-gold',
            )}
            key={item}
            role="tab"
            aria-selected={tab === item}
            aria-controls={`panel-${item}`}
            id={`tab-${item}`}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const step = event.key === 'ArrowLeft' ? -1 : 1;
              let next = (index + step + tabs.length) % tabs.length;
              if (event.key === 'Home') next = 0;
              if (event.key === 'End') next = tabs.length - 1;
              setTab(tabs[next]);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [next]?.focus();
            }}
          >
            {
              {
                events: t('eventHistory'),
                state: t('sourceLocalState'),
                email: t('confirmationEmail'),
              }[item]
            }
            {item === 'email' && (
              <span className="ml-2 rounded-[3px] bg-stone-200 px-[5px] py-px text-[10px]">
                {data.receipt ? 1 : 0}
              </span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'events' && <EventHistory data={data} onAction={onAction} pending={pending} />}
        {tab === 'state' && <StateComparison data={data} />}
        {tab === 'email' && <EmailPanel data={data} onAction={onAction} pending={pending} />}
      </div>
    </section>
  );
}
