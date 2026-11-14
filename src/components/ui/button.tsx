import type { ButtonProps, ButtonVariant, IconButtonProps } from '../../types/primitives';
import { cn } from '../../lib/cn';

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold';
const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-gold text-white hover:bg-gold-dark',
  secondary: 'border-line bg-transparent hover:bg-stone-200',
  danger: 'border-line text-danger hover:bg-danger-soft',
};

export function buttonStyles(variant: ButtonVariant = 'secondary', className?: string) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border',
    'px-[18px] py-[11px] text-[13px] font-medium whitespace-nowrap transition-colors',
    'disabled:cursor-wait disabled:opacity-50',
    focus,
    variants[variant],
    className,
  );
}

export function Button({
  variant = 'secondary',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, className)} {...props} />;
}

export function IconButton({ label, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center',
        'rounded-full border border-line transition-colors hover:bg-stone-200',
        'disabled:cursor-wait disabled:opacity-50',
        focus,
        className,
      )}
      {...props}
    />
  );
}
