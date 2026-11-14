import { useTranslations } from 'next-intl';
import { Check, Minus } from 'lucide-react';
import type { ReservationSummaryProps } from '../types/ui';
import { cn } from '../lib/cn';
import { differingFields, reservationFields } from '../lib/reservation-view';

export function StateComparison({ data }: ReservationSummaryProps) {
  const t = useTranslations('StateComparison');
  const fields = useTranslations('Common.fields');
  const status = useTranslations('Status');

  const differences = differingFields(data.source, data.local);
  const matched = !!data.source && !!data.local && differences.length === 0;
  return (
    <div className="px-[26px] py-6">
      <div
        className={cn(
          'mb-5 flex items-center gap-2.5 text-[13px]',
          matched ? 'text-success' : 'text-warning',
        )}
      >
        {matched ? <Check size={18} /> : <Minus size={18} />}
        {matched
          ? t('localStateMatchesTheSource')
          : data.source
            ? t('differences', { count: differences.length })
            : t('sourceUnavailable')}
      </div>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="text-[10px] tracking-wider uppercase">
            <tr>
              <th className="border-b border-line px-3.5 py-3 text-left font-medium text-muted">
                {t('field')}
              </th>
              <th className="border-b border-line px-3.5 py-3 text-left font-medium text-muted">
                {t('source')}
              </th>
              <th className="border-b border-line px-3.5 py-3 text-left font-medium text-muted">
                {t('localView')}
              </th>
              <th className="border-b border-line px-3.5 py-3 text-left font-medium text-muted">
                {t('match')}
              </th>
            </tr>
          </thead>
          <tbody>
            {reservationFields.map((key) => {
              const same = data.source?.[key] === data.local?.[key];
              return (
                <tr key={key} className={cn(!same && 'bg-warning-soft')}>
                  <th className="border-b border-line px-3.5 py-3 text-left font-medium text-muted">
                    {fields(key)}
                  </th>
                  <td className="border-b border-line px-3.5 py-3 text-left [&_svg]:text-success">
                    {key === 'status' && data.source
                      ? status(data.source.status)
                      : (data.source?.[key] ?? '—')}
                  </td>
                  <td className="border-b border-line px-3.5 py-3 text-left [&_svg]:text-success">
                    {key === 'status' && data.local
                      ? status(data.local.status)
                      : (data.local?.[key] ?? '—')}
                  </td>
                  <td
                    className="border-b border-line px-3.5 py-3 text-left [&_svg]:text-success"
                    aria-label={t(same ? 'matching' : 'different')}
                  >
                    {same ? <Check size={15} /> : <Minus size={15} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
