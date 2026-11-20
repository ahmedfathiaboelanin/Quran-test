import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-700 text-white shadow-sm shadow-teal-950/25 ring-1 ring-inset ring-white/10 hover:bg-teal-800 active:bg-teal-900',
  secondary:
    'border border-stone-300 bg-[#fbf7ee] text-stone-800 hover:border-stone-400 hover:bg-stone-50 dark:hover:bg-stone-200',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
  soft: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200/70 hover:bg-teal-100',
  danger: 'bg-rose-700 text-white shadow-sm shadow-rose-950/20 hover:bg-rose-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'min-h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'min-h-13 gap-2.5 rounded-xl px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] motion-reduce:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ecdf] dark:focus-visible:ring-offset-[#0b120f]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
