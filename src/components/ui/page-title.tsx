import type { HeadingProps } from '../../types/primitives';
import { cn } from '../../lib/cn';

export function PageTitle({ className, ...props }: HeadingProps) {
  return (
    <h1
      className={cn(
        'font-display text-[clamp(38px,4vw,54px)] leading-[1.15] font-normal',
        'tracking-[-1.5px] [&_em]:font-light [&_em]:text-gold',
        className,
      )}
      {...props}
    />
  );
}
