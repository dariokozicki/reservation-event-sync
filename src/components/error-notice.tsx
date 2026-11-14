import { useTranslations } from 'next-intl';
import type { ErrorNoticeProps } from '../types/http';
import { ApiError } from '../lib/api-error';
import { Button } from './ui/button';

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  const t = useTranslations('Errors');
  const common = useTranslations('Common');
  const code = error instanceof ApiError ? error.code : 'request';
  return (
    <div className="my-4 rounded-md bg-danger-soft px-[18px] py-3.5 text-danger" role="alert">
      <p>{t(code)}</p>
      <details className="my-2 text-xs">
        <summary className="w-fit cursor-pointer">{t('detail')}</summary>
        <p className="mt-2 wrap-anywhere">{error.message}</p>
      </details>
      {onRetry && <Button onClick={onRetry}>{common('retry')}</Button>}
    </div>
  );
}
