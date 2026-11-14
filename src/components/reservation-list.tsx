import { useTranslations } from 'next-intl';
import { cn } from '../lib/cn';
import { ArrowRight, Layers3 } from 'lucide-react';
import type { ReservationListProps } from '../types/ui';
import { Badge } from './badge';
import { isDemoScenario } from './scenario-options';
import { synchronizationStatus } from '../lib/reservation-view';

export function ReservationList({
  reservations,
  selected,
  onSelect,
  loading,
}: ReservationListProps) {
  const t = useTranslations('ReservationList');
  const scenarios = useTranslations('Scenarios');
  const sync = useTranslations('SyncStatus');

  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between px-[26px] pt-6 pb-5 max-[520px]:px-[18px]">
        <div>
          <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('eyebrow')}</p>
          <h2 className="font-display text-[25px] font-normal tracking-[-0.4px]">
            {t('reservations')}
          </h2>
        </div>
        <span className="text-xs text-muted">{t('latest100')}</span>
      </div>
      {!reservations.length ? (
        <div
          className={cn(
            'flex min-h-[280px] flex-col items-center justify-center gap-3 p-[30px]',
            'text-center [&_p]:max-w-[270px] [&_p]:text-[13px] [&_svg]:text-gold',
            '[&_p]:leading-relaxed [&_p]:text-muted',
          )}
        >
          <Layers3 size={32} strokeWidth={1} />
          <h3 className="text-[15px] font-semibold">
            {loading ? t('loadingReservations') : t('noEventsReceivedYet')}
          </h3>
          <p>{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="max-h-[350px] overflow-auto px-3 pb-3">
          {reservations.map((item) => {
            const state = item.local ?? item.source;
            const syncLabel = sync(synchronizationStatus(item));
            const scenario = isDemoScenario(item.scenario)
              ? scenarios(`${item.scenario}.name`)
              : t(item.scenario === 'manual' ? 'manual' : 'external');
            return (
              <button
                key={item.id}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3.5 rounded-[5px] border',
                  'border-transparent border-t-line px-3.5 py-[17px] text-left',
                  'hover:bg-paper focus-visible:outline-2 focus-visible:outline-gold',
                  'max-[520px]:gap-2 max-[520px]:px-2 max-[520px]:[&>svg]:hidden',
                  selected === item.id && 'border-gold/40 bg-warning-soft/50',
                )}
                onClick={() => onSelect(item.id)}
                aria-pressed={selected === item.id}
              >
                <span
                  className={cn(
                    'grid size-[38px] shrink-0 place-items-center rounded-full bg-stone-200',
                    'font-display text-xl text-gold max-[520px]:hidden',
                  )}
                >
                  {state?.guestName.slice(0, 1) ?? '?'}
                </span>
                <span
                  className={cn(
                    'flex min-w-0 flex-1 flex-col gap-1 [&_strong]:text-sm [&_strong]:font-medium',
                    '[&_span]:text-xs [&_span]:text-muted',
                  )}
                >
                  <strong>{state?.guestName ?? t('awaitingCreation')}</strong>
                  <span>{state?.property ?? item.id.slice(0, 8)}</span>
                  <span className="text-xs">
                    {scenario} · {item.id.slice(0, 8)}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1.5">
                  <Badge value={item.local?.status ?? 'buffered'} />
                  <span className="text-xs text-muted">
                    {t('versionStatus', { version: item.local?.version ?? 0, status: syncLabel })}
                  </span>
                </span>
                <ArrowRight size={16} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
