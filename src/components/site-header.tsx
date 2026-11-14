import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SiteHeaderProps } from '../types/primitives';
import { cn } from '../lib/cn';

export function SiteHeader({ children }: SiteHeaderProps) {
  const t = useTranslations('Common');
  return (
    <>
      <a className="absolute -top-24 z-10 bg-white p-3 focus:top-0" href="#main">
        {t('skip')}
      </a>
      <header
        className={cn(
          'flex h-[85px] items-center justify-between gap-6 border-b border-line px-[5%]',
          'max-[520px]:h-[70px] max-[520px]:gap-3',
        )}
      >
        <Link
          href="/"
          aria-label={t('home')}
          className={cn(
            'flex items-center gap-4 text-lg tracking-[5px]',
            'focus-visible:outline-2 focus-visible:outline-gold',
            'max-[520px]:gap-2 max-[520px]:text-sm max-[520px]:tracking-[3px]',
          )}
        >
          <Building2 size={25} strokeWidth={1.2} className="text-gold" /> {t('brand')}
        </Link>
        {children}
        <span className="flex items-center gap-2 text-[11px] text-muted max-[900px]:hidden">
          <span className="size-1.5 rounded-full bg-sage" /> {t('environment')}
        </span>
      </header>
    </>
  );
}
