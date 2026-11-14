import { useTranslations } from 'next-intl';
import { cn } from '../lib/cn';
import type { ReservationSummaryProps } from '../types/ui';
import { Badge } from './badge';
import { synchronizationStatus } from '../lib/reservation-view';

export function ReservationSummary({ data }: ReservationSummaryProps) {
  const t = useTranslations('ReservationSummary');
  const common = useTranslations('Common');
  const sync = useTranslations('SyncStatus');
  return (
    <section
      className="mb-6 grid grid-cols-3 gap-[18px] max-[700px]:grid-cols-1 max-[700px]:gap-2.5"
      aria-label={t('reservationStatusSummary')}
    >
      <div
        className={cn(
          'rounded-lg border border-line bg-surface p-6 wrap-anywhere',
          'max-[700px]:p-[18px] [&_strong]:text-[19px] [&_strong]:font-medium',
          '[&>p:last-child]:mt-3.5 [&>p:last-child]:text-[13px]',
          '[&>p:last-child]:text-muted',
        )}
      >
        <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('reservation')}</p>
        <Badge value={data.local?.status ?? 'buffered'} />
        <p>{data.local?.guestEmail ?? t('creationHasNotBeenApplied')}</p>
      </div>
      <div
        className={cn(
          'rounded-lg border border-line bg-surface p-6 wrap-anywhere',
          'max-[700px]:p-[18px] [&_strong]:text-[19px] [&_strong]:font-medium',
          '[&>p:last-child]:mt-3.5 [&>p:last-child]:text-[13px]',
          '[&>p:last-child]:text-muted',
        )}
      >
        <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('synchronization')}</p>
        <strong>{sync(synchronizationStatus(data))}</strong>
        <p>
          {t('versions', {
            local: data.local?.version ?? 0,
            source: data.source ? String(data.source.version) : common('unknown'),
          })}
        </p>
      </div>
      <div
        className={cn(
          'rounded-lg border border-line bg-surface p-6 wrap-anywhere',
          'max-[700px]:p-[18px] [&_strong]:text-[19px] [&_strong]:font-medium',
          '[&>p:last-child]:mt-3.5 [&>p:last-child]:text-[13px]',
          '[&>p:last-child]:text-muted',
        )}
      >
        <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('confirmationEmail')}</p>
        <Badge value={data.confirmation?.status ?? 'not_scheduled'} />
        <p>
          {common('acceptedEmails', { count: data.receipt ? 1 : 0 })} ·{' '}
          {common('attempts', { count: data.attempts.length })}
        </p>
      </div>
    </section>
  );
}
