import { cn } from '../../utils/helpers';

interface ProgressBarProps {
  value: number;
  className?: string;
  label?: string;
  tone?: 'teal' | 'amber';
}

export function ProgressBar({
  value,
  className,
  label = 'تقدم الاختبار',
  tone = 'teal',
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'teal'
            ? 'bg-gradient-to-l from-teal-600 to-emerald-500'
            : 'bg-gradient-to-l from-amber-500 to-amber-400',
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
