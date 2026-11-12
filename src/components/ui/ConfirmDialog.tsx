import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { cn } from '../../utils/helpers';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary' | 'warning';
  icon?: LucideIcon;
  onConfirm: () => void;
  onClose: () => void;
}

const toneStyles = {
  danger: {
    icon: 'bg-rose-100 text-rose-700',
    button: 'danger' as const,
  },
  warning: {
    icon: 'bg-amber-100 text-amber-700',
    button: 'primary' as const,
  },
  primary: {
    icon: 'bg-teal-100 text-teal-700',
    button: 'primary' as const,
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'primary',
  icon: Icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const containerRef = useDialogFocus(open, onClose);
  const ToneIcon = Icon ?? (tone === 'danger' ? AlertTriangle : Info);
  const styles = toneStyles[tone];

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-description' : undefined}
      dir="rtl"
    >
      <button
        type="button"
        aria-label="إغلاق نافذة التأكيد"
        onClick={onClose}
        className="overlay-enter absolute inset-0 h-full w-full cursor-default bg-stone-950/50 backdrop-blur-sm"
      />

      <div
        ref={containerRef}
        className="dialog-enter relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-[#fffdf7] shadow-2xl shadow-stone-950/20"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-stone-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-6">
          <span
            className={cn(
              'grid h-12 w-12 place-items-center rounded-2xl shadow-sm',
              styles.icon,
            )}
          >
            <ToneIcon className="h-6 w-6" />
          </span>

          <h2
            id="confirm-dialog-title"
            className="mt-4 pe-10 text-lg font-bold text-stone-900"
          >
            {title}
          </h2>
          {description ? (
            <p
              id="confirm-dialog-description"
              className="mt-2 text-sm leading-7 text-stone-600"
            >
              {description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="sm:flex-1"
              onClick={onClose}
              autoFocus
            >
              {cancelLabel}
            </Button>
            <Button
              variant={styles.button}
              className="sm:flex-1"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
