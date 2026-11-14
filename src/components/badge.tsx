import { useTranslations } from 'next-intl';
import type { BadgeProps } from '../types/ui';
import statusMessages from '../i18n/en/status';
import { cn } from '../lib/cn';

const success = new Set(['confirmed', 'applied', 'accepted', 'delivered']);
const warning = new Set(['pending', 'buffered', 'retrying', 'response_lost']);
const danger = new Set(['cancelled', 'blocked', 'failed', 'conflict', 'rejected']);
const info = new Set(['duplicate', 'deduplicated']);

export function Badge({ value }: BadgeProps) {
  const t = useTranslations('Status');
  const key = Object.hasOwn(statusMessages, value)
    ? (value as keyof typeof statusMessages)
    : 'unknown';
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-[3px] text-[10px] font-medium whitespace-nowrap',
        'bg-stone-100 text-muted',
        success.has(value) && 'bg-success-soft text-success',
        warning.has(value) && 'bg-warning-soft text-warning',
        danger.has(value) && 'bg-danger-soft text-danger',
        info.has(value) && 'bg-info-soft text-info',
      )}
    >
      {t(key)}
    </span>
  );
}
