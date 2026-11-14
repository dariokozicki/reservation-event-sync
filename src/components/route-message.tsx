import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { RouteMessageProps } from '../types/ui';
import { Button, buttonStyles } from './ui/button';
import { PageTitle } from './ui/page-title';

export function RouteMessage({ state, reset }: RouteMessageProps) {
  const t = useTranslations('Routes');
  const common = useTranslations('Common');
  return (
    <main className="mx-auto max-w-[1480px] px-[5%] pt-20">
      <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t(`${state}.eyebrow`)}</p>
      <PageTitle>{t(`${state}.title`)}</PageTitle>
      <p className="my-4" role={state === 'unavailable' ? 'alert' : 'status'}>
        {t(`${state}.description`)}
      </p>
      <div className="flex gap-2">
        {reset && <Button onClick={reset}>{common('retry')}</Button>}
        {state !== 'loading' && (
          <Link className={buttonStyles()} href="/">
            {common('back')}
          </Link>
        )}
      </div>
    </main>
  );
}
