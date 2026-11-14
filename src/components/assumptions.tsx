import { useTranslations } from 'next-intl';
import { cn } from '../lib/cn';

export function Assumptions() {
  const t = useTranslations('Dashboard');

  return (
    <section
      className={cn(
        'rounded-lg border border-line bg-surface p-8 [&_ol]:my-6 [&_ol]:list-decimal',
        '[&_li]:my-3 [&_li]:leading-relaxed [&_ol]:pl-6',
      )}
    >
      <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('contractLabel')}</p>
      <h2 className="font-display text-[25px] font-normal tracking-[-0.4px]">
        {t('contractTitle')}
      </h2>
      <ol>
        <li>{t('creation')}</li>
        <li>{t('firstConfirmation')}</li>
        <li>{t('cancellation')}</li>
        <li>{t('updates')}</li>
        <li>{t('versions')}</li>
        <li>{t('duplicatesContract')}</li>
        <li>{t('laterCancellation')}</li>
        <li>{t('unconfirmedCancellation')}</li>
        <li>{t('providerIdempotency')}</li>
        <li>{t('accessControl')}</li>
        <li>{t('failures')}</li>
      </ol>
      <p className="text-muted">{t('scope')}</p>
    </section>
  );
}
