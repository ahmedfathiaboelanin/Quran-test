import { createPortal } from 'react-dom';
import { Keyboard, X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const NAVIGATION_SHORTCUTS = [
  { keys: ['→'], label: 'الآية أو الصفحة السابقة' },
  { keys: ['←'], label: 'الآية أو الصفحة التالية' },
  { keys: ['Home'], label: 'العودة إلى بداية السؤال' },
];

const ACTION_SHORTCUTS = [
  { keys: ['H', 'V'], label: 'إظهار أو إخفاء النص' },
  { keys: ['P'], label: 'تبديل عرض الآية / الصفحة' },
  { keys: ['1'], label: 'تسجيل رد خاطئ (+١)' },
  { keys: ['2'], label: 'تسجيل تنبيه (+٠٫٥)' },
  { keys: ['3'], label: 'تسجيل تردد (+٠٫٢٥)' },
  { keys: ['Enter'], label: 'حفظ والتالي' },
  { keys: ['؟'], label: 'فتح هذه النافذة' },
];

function Keycap({ children }: { children: string }) {
  return (
    <kbd className="inline-grid min-h-7 min-w-7 place-items-center rounded-lg border border-stone-300 border-b-2 bg-white px-1.5 font-sans text-[11px] font-bold text-stone-700 shadow-2xs dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const containerRef = useDialogFocus(open, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      dir="rtl"
    >
      <button
        type="button"
        aria-label="إغلاق اختصارات لوحة المفاتيح"
        onClick={onClose}
        className="overlay-enter absolute inset-0 h-full w-full cursor-default bg-stone-950/50 backdrop-blur-sm"
      />

      <div
        ref={containerRef}
        className="dialog-enter relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-stone-200/90 bg-[#fffdf7] shadow-2xl shadow-stone-950/20 dark:border-stone-800 dark:bg-[#101816]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-stone-200/80 bg-[#fffdf7]/95 px-5 py-4 backdrop-blur dark:border-stone-800 dark:bg-[#101816]/95">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Keyboard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-teal-700 dark:text-teal-400">
                إنجاز أسرع
              </p>
              <h2
                id="shortcuts-dialog-title"
                className="text-base font-bold text-stone-900"
              >
                اختصارات لوحة المفاتيح
              </h2>
            </div>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-stone-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section>
            <h3 className="text-xs font-bold text-stone-500">التنقل</h3>
            <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
              {NAVIGATION_SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.label}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-sm font-medium text-stone-700">
                    {shortcut.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Keycap key={key}>{key}</Keycap>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold text-stone-500">التقييم والتحكم</h3>
            <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
              {ACTION_SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.label}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-sm font-medium text-stone-700">
                    {shortcut.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Keycap key={key}>{key}</Keycap>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="rounded-xl bg-teal-50/80 px-3 py-2.5 text-[11px] leading-6 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
            تعمل الاختصارات خارج حقول الكتابة. على الهاتف يمكنك استخدام أزرار شريط
            التقييم السفلي بدلًا منها.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
