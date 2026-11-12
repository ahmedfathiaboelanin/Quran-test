import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ToastProps {
  message: string;
  tone?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  info: {
    icon: Info,
    iconClass: 'text-teal-600',
    border: 'border-teal-200',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-rose-600',
    border: 'border-rose-200',
  },
};

export function Toast({
  message,
  tone = 'success',
  onClose,
  duration = 2200,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose]);

  const styles = toneStyles[tone];
  const Icon = styles.icon;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-[90] flex justify-center px-4 print:hidden"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'toast-enter pointer-events-auto inline-flex items-center gap-2 rounded-2xl border bg-white/95 px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-lg shadow-stone-950/10 backdrop-blur',
          styles.border,
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', styles.iconClass)} />
        {message}
      </div>
    </div>,
    document.body,
  );
}
