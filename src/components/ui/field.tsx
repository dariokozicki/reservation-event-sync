import type { InputProps, LabelProps, SelectProps } from '../../types/primitives';
import { cn } from '../../lib/cn';

const control = cn(
  'min-h-[41px] w-full rounded-[5px] border border-line bg-white px-[11px] py-2.5',
  'text-[13px] text-ink focus:outline-2 focus:outline-offset-1 focus:outline-gold',
  'disabled:cursor-wait disabled:opacity-50',
);

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn(control, 'cursor-pointer', className)} {...props} />;
}

export function Field({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-xs font-medium [&>input]:mt-1.5 [&>select]:mt-1.5', className)}
      {...props}
    />
  );
}
