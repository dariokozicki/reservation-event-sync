import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '../lib/cn';
import { ArrowRight, RotateCcw, Send } from 'lucide-react';
import type { InspectorProps } from '../types/ui';
import type { ReservationDetails } from '../types/domain';
import { Badge } from './badge';
import { IconButton } from './ui/button';

export function EventHistory({ data, pending, onAction }: InspectorProps) {
  const t = useTranslations('EventHistory');
  const status = useTranslations('Status');
  const fields = useTranslations('Common.fields');
  const format = useFormatter();

  const events = data.events.length ? data.events : data.inbox;
  return (
    <div className="grid grid-cols-2 max-[680px]:grid-cols-1">
      <div className="min-w-0 px-[26px] py-6 max-[680px]:px-[18px]">
        <div className="mb-5 flex items-center justify-between gap-2.5">
          <h3 className="text-[15px] font-semibold">{t('sourceSequence')}</h3>
          <span className="text-xs text-muted">{t('versionOrder')}</span>
        </div>
        {events.map((item) => {
          const received = data.inbox.find((entry) => entry.id === item.id);
          return (
            <div
              className={cn(
                'relative flex gap-3.5 pb-[22px] not-last:before:absolute',
                'not-last:before:top-8 not-last:before:bottom-0 not-last:before:left-[15px]',
                'not-last:before:w-px not-last:before:bg-line',
              )}
              key={item.id}
            >
              <span
                className={cn(
                  'grid size-[31px] shrink-0 place-items-center rounded-full border',
                  'border-line text-xs text-gold',
                  received?.state === 'applied' && 'border-gold/30 bg-warning-soft',
                )}
              >
                {item.version}
              </span>
              <div
                className={cn(
                  'min-w-0 flex-1 [&>div]:flex [&>div]:items-center [&>div]:gap-2.5',
                  '[&_p]:my-1.5 [&_strong]:text-[13px] [&_strong]:font-medium [&>div]:pt-[3px]',
                  '[&_p]:leading-normal',
                )}
              >
                <div>
                  <strong>{status(item.event.type)}</strong>
                  <Badge value={received?.state ?? 'not_sent'} />
                </div>
                <p className="text-xs text-muted">
                  {item.event.type === 'updated'
                    ? Object.entries(item.event.payload)
                        .map(([key, value]) => {
                          const label = fields(key as keyof ReservationDetails);
                          return `${label}: ${value}`;
                        })
                        .join(' · ')
                    : t(`description.${item.event.type}`)}
                </p>
                <details
                  className={cn(
                    '[&_pre]:mt-2 [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-stone-200',
                    '[&_pre]:p-3 [&_pre]:text-[11px]',
                  )}
                >
                  <summary
                    className={cn(
                      'w-fit cursor-pointer text-[11px] text-gold focus-visible:outline-2',
                      'focus-visible:outline-gold',
                    )}
                  >
                    {t('payload')}
                  </summary>
                  <pre>{JSON.stringify(item.event, null, 2)}</pre>
                </details>
              </div>
              {data.events.length > 0 && (
                <IconButton
                  disabled={pending}
                  label={t(received ? 'resend' : 'deliver', { version: item.version })}
                  onClick={() => onAction({ action: 'deliver', eventId: item.id })}
                >
                  {received ? <RotateCcw size={16} /> : <Send size={16} />}
                </IconButton>
              )}
            </div>
          );
        })}
      </div>
      <div
        className={cn(
          'min-w-0 border-l border-line bg-paper/50 px-[26px] py-6 max-[680px]:border-t',
          'max-[680px]:border-l-0 max-[680px]:px-[18px]',
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-2.5">
          <h3 className="text-[15px] font-semibold">{t('deliveryLog')}</h3>
          <span className="text-xs text-muted">
            {t('receivedCount', { count: data.deliveries.length })}
          </span>
        </div>
        <div className="max-h-[400px] overflow-auto">
          {data.deliveries.map((item) => (
            <div
              className={cn(
                'border-b border-line py-3 first:pt-0 [&_p]:mt-[7px] [&_p]:text-xs',
                '[&_p]:leading-normal [&_p]:text-muted',
              )}
              key={item.id}
            >
              <div
                className={cn(
                  'flex items-center gap-2 [&_code]:text-xs [&_time]:ml-auto',
                  '[&_time]:text-[10px] [&_time]:text-muted',
                )}
              >
                <code>{t('version', { version: item.version })}</code>
                <ArrowRight size={12} />
                <Badge value={item.outcome} />
                <time dateTime={item.receivedAt}>
                  {format.dateTime(new Date(item.receivedAt), { timeStyle: 'medium' })}
                </time>
              </div>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
