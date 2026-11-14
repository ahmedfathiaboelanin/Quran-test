import { useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { cn } from '../../utils/helpers';

interface MonthlySheetDialogProps {
  open: boolean;
  title: string;
  description?: string;
  icon?: LucideIcon;
  maxWidth?: 'md' | 'lg' | 'xl';
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const maxWidthClasses = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Shared accessible dialog shell for the monthly tracking screens. */
export function MonthlySheetDialog({
  open,
  title,
  description,
  icon: Icon,
  maxWidth = 'md',
  onClose,
  children,
  footer,
}: MonthlySheetDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useDialogFocus(open, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      dir="rtl"
    >
      <button
        type="button"
        aria-label="إغلاق النافذة"
        onClick={onClose}
        className="overlay-enter absolute inset-0 h-full w-full cursor-default bg-stone-950/50 backdrop-blur-sm"
      />

      <div
        ref={containerRef}
        className={cn(
          'dialog-enter relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-[#fffdf7] shadow-2xl shadow-stone-950/20 sm:max-h-[min(52rem,calc(100dvh-3rem))]',
          maxWidthClasses[maxWidth],
        )}
      >
        <div className="flex items-start gap-3 border-b border-stone-200/80 bg-[#f8f5ee]/70 px-5 py-4 sm:px-6">
          {Icon ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-800">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-stone-900">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-0.5 text-xs leading-5 text-stone-500"
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="border-t border-stone-200/80 bg-[#f8f5ee]/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
