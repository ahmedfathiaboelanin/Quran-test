import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { UsageGuide } from './UsageGuide';

interface UsageGuideModalProps {
  onClose: () => void;
}

export function UsageGuideModal({ onClose }: UsageGuideModalProps) {
  const containerRef = useDialogFocus(true, onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-guide-title"
      dir="rtl"
    >
      <button
        type="button"
        aria-label="إغلاق تعليمات الاستخدام"
        onClick={onClose}
        className="overlay-enter absolute inset-0 h-full w-full cursor-default bg-stone-950/50 backdrop-blur-sm"
      />

      <div
        ref={containerRef}
        className="dialog-enter relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-[#f8f5ee] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200/80 bg-white/80 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-teal-700">
              مساعدة سريعة
            </p>
            <h2
              id="usage-guide-title"
              className="text-base font-bold text-stone-900 sm:text-lg"
            >
              تعليمات الاستخدام
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-3 sm:p-5">
          <UsageGuide />
        </div>
      </div>
    </div>,
    document.body,
  );
}
