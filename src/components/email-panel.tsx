import { useTranslations } from 'next-intl';
import { Button, buttonStyles } from './ui/button';
import { Field, Select } from './ui/field';
import { cn } from '../lib/cn';
import { Mail, RotateCcw } from 'lucide-react';
import { faultSchema } from '../domain/schemas';
import type { InspectorProps } from '../types/ui';
import { Badge } from './badge';

export function EmailPanel({ data, pending, onAction }: InspectorProps) {
  const t = useTranslations('EmailPanel');
  const common = useTranslations('Common');

  const email = data.confirmation;
  return (
    <div
      className={cn(
        'grid grid-cols-2 max-[680px]:grid-cols-1 [&>div]:min-w-0 [&>div]:px-[26px]',
        '[&>div]:py-6',
      )}
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-2.5">
          <h3 className="text-[15px] font-semibold">{t('confirmation')}</h3>
          <Badge value={email?.status ?? 'not_scheduled'} />
        </div>
        {email ? (
          <div
            className={cn(
              'rounded-md border border-line bg-white p-5 [&>pre]:font-sans',
              '[&>pre]:text-[13px] [&>pre]:leading-[1.8] [&>pre]:whitespace-pre-wrap',
              '[&_h4]:py-[18px] [&>pre]:wrap-anywhere',
            )}
          >
            <p
              className={cn(
                'flex gap-3 border-b border-line pb-3.5 text-xs [&_span]:text-[10px]',
                '[&_span]:text-muted',
              )}
            >
              <span>{t('to')}</span>
              {email.payload.to}
            </p>
            <h4 className="text-sm font-medium">{email.payload.subject}</h4>
            <pre>{email.payload.body}</pre>
            {email.payload.reservationUrl && (
              <a className={buttonStyles()} href={email.payload.reservationUrl}>
                {t('viewReservation')}
              </a>
            )}
            <div
              className={cn(
                'mt-5 border-t border-line pt-3.5 [&_span]:mb-[7px] [&_span]:block',
                '[&_span]:text-[9px] [&_span]:tracking-wider [&_span]:text-muted',
                '[&_code]:text-[10px] [&_code]:wrap-anywhere',
              )}
            >
              <span>{t('idempotencyKey')}</span>
              <code>{email.payload.key}</code>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex min-h-[280px] flex-col items-center justify-center gap-3 p-[30px]',
              'text-center [&_p]:max-w-[270px] [&_p]:text-[13px] [&_svg]:text-gold',
              'min-h-[230px] [&_p]:leading-relaxed [&_p]:text-muted',
            )}
          >
            <Mail size={28} strokeWidth={1} />
            <h3 className="text-[15px] font-semibold">{t('noConfirmationScheduled')}</h3>
            <p>{t('emptyDescription')}</p>
          </div>
        )}
      </div>
      <div
        className={cn(
          'border-l border-line bg-paper/50 max-[680px]:border-t max-[680px]:border-l-0',
          '[&_select]:my-2',
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-2.5">
          <h3 className="text-[15px] font-semibold">{t('simulatedProvider')}</h3>
          <span className="text-[11px] text-success">
            {common('acceptedEmails', { count: data.receipt ? 1 : 0 })}
          </span>
        </div>
        <Field htmlFor="provider-mode">{t('failureMode')}</Field>
        <Select
          id="provider-mode"
          value={data.fault}
          disabled={pending}
          onChange={(event) => {
            const fault = faultSchema.safeParse(event.target.value);
            if (fault.success) onAction({ action: 'fault', fault: fault.data });
          }}
        >
          <option value="none">{t('normalDelivery')}</option>
          <option value="fail_once">{t('failTheFirstAttempt')}</option>
          <option value="lose_ack_once">{t('acceptFirstEmailLoseResponse')}</option>
          <option value="always_fail">{t('providerUnavailable')}</option>
        </Select>
        <p className="text-xs text-muted">{t('providerNote')}</p>
        {email?.lastError && <p className="my-3 text-xs text-danger">{email.lastError}</p>}
        {email?.status === 'failed' && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => onAction({ action: 'retry' })}
          >
            <RotateCcw size={15} /> {t('retryFailedEmail')}
          </Button>
        )}
        <div className="mt-[22px]">
          {data.attempts.map((attempt, index) => (
            <div
              className={cn(
                'flex gap-3 border-t border-line py-3 [&_p]:mt-1.5 [&_p]:text-xs',
                '[&_p]:leading-relaxed [&_p]:text-muted',
              )}
              key={attempt.id}
            >
              <span className="pt-[3px] text-xs text-muted">{index + 1}</span>
              <div>
                <Badge value={attempt.outcome} />
                <p>{attempt.message}</p>
              </div>
            </div>
          ))}
          {!data.attempts.length && (
            <p className="text-xs text-muted">{t('noDeliveryAttemptsYet')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
