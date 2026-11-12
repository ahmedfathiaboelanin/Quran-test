import { useCallback, useState } from 'react';
import {
  BookOpenText,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  Sparkles,
  Type,
} from 'lucide-react';
import type { AyahRef } from '../../types';
import { cn, formatNumber } from '../../utils/helpers';
import { getAyahReferenceLabel } from '../../utils/quranHelpers';
import { Toast } from '../ui/Toast';

interface VerseToast {
  message: string;
  tone: 'success' | 'error';
}

interface VerseCardProps {
  ayah: AyahRef;
  /** When provided, the entire mushaf page is rendered instead of one ayah. */
  pageAyahs?: AyahRef[];
  questionStartAyahNumber: number;
  isHidden: boolean;
  isQuestionStart: boolean;
  offsetFromStart: number;
  onReveal: () => void;
  onToggleDisplayMode?: () => void;
}

export function VerseCard({
  ayah,
  pageAyahs,
  questionStartAyahNumber,
  isHidden,
  isQuestionStart,
  offsetFromStart,
  onReveal,
  onToggleDisplayMode,
}: VerseCardProps) {
  const pageMode = Boolean(pageAyahs);
  const displayedPageAyahs = pageAyahs?.length ? pageAyahs : [ayah];

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>(() => {
    try {
      const saved = localStorage.getItem('quran_verse_font_size');
      if (saved === 'normal' || saved === 'large' || saved === 'huge') return saved;
    } catch {}
    return 'normal';
  });
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<VerseToast | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const handleCopy = async () => {
    const textToCopy = pageMode
      ? displayedPageAyahs.map((a) => a.text).join(' ')
      : ayah.text;

    if (!navigator.clipboard?.writeText) {
      setToast({
        message: 'تعذّر النسخ — المتصفح لا يدعم الحافظة',
        tone: 'error',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      setToast({
        message: pageMode ? 'تم نسخ نص الصفحة' : 'تم نسخ نص الآية',
        tone: 'success',
      });
    } catch {
      setToast({
        message: 'تعذّر نسخ النص — تحقق من إذن الحافظة',
        tone: 'error',
      });
    }
  };

  const cycleFontSize = () => {
    setFontSize((current) => {
      const next = current === 'normal' ? 'large' : current === 'large' ? 'huge' : 'normal';
      try {
        localStorage.setItem('quran_verse_font_size', next);
      } catch {}
      return next;
    });
  };

  const fontSizeLabel =
    fontSize === 'normal' ? 'خط عادي' : fontSize === 'large' ? 'خط كبير' : 'خط كبير جداً';

  return (
    <article
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-teal-900/15 bg-[#fffdf7] shadow-md shadow-teal-950/[0.04]"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_15%_10%,#99f6e4_0,transparent_32%),radial-gradient(circle_at_85%_90%,#fde68a_0,transparent_30%)] dark:opacity-[0.18]" />

      <div className="relative p-4 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-white shadow-sm sm:h-8 sm:w-8">
              <BookOpenText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-stone-900 sm:text-sm">
                {pageMode
                  ? `الصفحة ${formatNumber(ayah.page)}`
                  : getAyahReferenceLabel(ayah)}
              </p>
              <p className="hidden text-[10px] text-stone-500 sm:block">
                {pageMode ? 'عرض الصفحة كاملة' : ayah.surahEnglishName}
              </p>
              <p className="text-[10px] text-stone-500 sm:hidden">
                {pageMode
                  ? `${formatNumber(displayedPageAyahs.length)} آية • الجزء ${formatNumber(ayah.juz)}`
                  : `صفحة ${formatNumber(ayah.page)} • الجزء ${formatNumber(ayah.juz)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onToggleDisplayMode ? (
              <button
                type="button"
                onClick={onToggleDisplayMode}
                title={
                  pageMode
                    ? 'الوضع الحالي: عرض الصفحة كاملة — اضغط للتبديل لعرض آية واحدة [P]'
                    : 'الوضع الحالي: عرض آية واحدة — اضغط للتبديل لعرض الصفحة كاملة [P]'
                }
                aria-label={
                  pageMode ? 'التبديل إلى عرض آية واحدة' : 'التبديل إلى عرض الصفحة كاملة'
                }
                className={cn(
                  'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-2xs transition active:scale-95',
                  pageMode
                    ? 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-200'
                    : 'border-stone-200 bg-white/90 text-stone-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900',
                )}
              >
                {pageMode ? (
                  <>
                    <FileText className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    <span>الصفحة كاملة</span>
                  </>
                ) : (
                  <>
                    <BookOpenText className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    <span>آية واحدة</span>
                  </>
                )}
              </button>
            ) : pageMode ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600 sm:px-2.5">
                <FileText className="h-3 w-3" />
                الصفحة كاملة
              </span>
            ) : null}

            {isQuestionStart ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-2 py-1 text-[10px] font-bold text-white sm:px-2.5">
                <Sparkles className="h-3 w-3" />
                بداية السؤال
              </span>
            ) : pageMode ? null : offsetFromStart > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 sm:px-2.5">
                +{formatNumber(offsetFromStart)} آية من البداية
              </span>
            ) : (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:px-2.5">
                {formatNumber(Math.abs(offsetFromStart))} آية قبل البداية
              </span>
            )}

            <span className="hidden items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600 sm:inline-flex">
              <FileText className="h-3 w-3" />
              صفحة {formatNumber(ayah.page)}
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600 sm:inline-flex">
              <Layers3 className="h-3 w-3" />
              الجزء {formatNumber(ayah.juz)}
            </span>

            {/* زر تعديل حجم الخط */}
            <button
              type="button"
              onClick={cycleFontSize}
              title={`حجم الخط: ${fontSizeLabel} — اضغط للتكبير`}
              aria-label={`حجم الخط: ${fontSizeLabel}`}
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 shadow-2xs transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf7] dark:focus-visible:ring-offset-[#121816]"
            >
              <Type className="h-3 w-3 text-teal-600" />
              <span>{fontSize === 'normal' ? 'خط عادي' : fontSize === 'large' ? 'خط كبير' : 'خط أقصى'}</span>
            </button>

            {/* زر نسخ النص */}
            <button
              type="button"
              onClick={() => void handleCopy()}
              title={copied ? 'تم النسخ!' : 'نسخ النص'}
              aria-label={copied ? 'تم النسخ!' : 'نسخ النص'}
              className="grid h-6 w-6 place-items-center rounded-full border border-stone-200 bg-white/90 text-stone-500 shadow-2xs transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf7] dark:focus-visible:ring-offset-[#121816]"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div className="relative mt-4 min-h-24 sm:mt-6 sm:min-h-52">
          {isHidden ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-teal-200 bg-white/70 px-4 py-5 text-center sm:min-h-52 sm:py-8">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-700 sm:h-12 sm:w-12">
                <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-700">النص مخفي</p>
                <p className="mt-1 text-xs text-stone-500">
                  {pageMode
                    ? 'اسمع تلاوة المختبر ثم اضغط لإظهار الصفحة والتحقق منها.'
                    : 'اسمع تلاوة المختبر ثم اضغط لإظهار الآية والتحقق منها.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onReveal}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <Eye className="h-3.5 w-3.5" />
                {pageMode ? 'إظهار نص الصفحة' : 'إظهار نص الآية'}
              </button>
            </div>
          ) : pageMode ? (
            <div
              dir="rtl"
              lang="ar"
              className={cn(
                'quran-text text-center text-stone-900 transition-[font-size]',
                fontSize === 'huge'
                  ? 'text-[1.65rem] leading-[2.4] sm:text-[2.1rem] sm:leading-[2.5] lg:text-[2.35rem]'
                  : fontSize === 'large'
                    ? 'text-[1.45rem] leading-[2.3] sm:text-[1.9rem] sm:leading-[2.35] lg:text-[2.1rem]'
                    : 'text-[1.3rem] leading-[2.15] sm:text-[1.7rem] sm:leading-[2.2] lg:text-[1.9rem]',
              )}
            >
              {displayedPageAyahs.map((pageAyah, index) => {
                const previousAyah = displayedPageAyahs[index - 1];
                const startsSurah =
                  !previousAyah ||
                  previousAyah.surahNumber !== pageAyah.surahNumber;
                const isStart = pageAyah.number === questionStartAyahNumber;

                return (
                  <div key={pageAyah.number} className="py-0.5">
                    {startsSurah ? (
                      <div className="my-1.5 flex items-center justify-center gap-2 font-sans text-[10px] font-bold text-teal-700">
                        <span className="h-px w-8 bg-teal-200" />
                        سورة {pageAyah.surahName}
                        <span className="h-px w-8 bg-teal-200" />
                      </div>
                    ) : null}
                    <p
                      className={cn(
                        'rounded-xl px-1 py-0.5 sm:px-2',
                        isStart && 'bg-amber-100/70 ring-1 ring-amber-300/80',
                      )}
                    >
                      {isStart ? (
                        <span className="me-1 inline-flex -translate-y-1 items-center rounded-full bg-amber-500 px-1.5 py-0.5 align-middle font-sans text-[9px] font-bold text-white">
                          بداية السؤال
                        </span>
                      ) : null}
                      <span>{pageAyah.text}</span>{' '}
                      <span className="inline-grid h-5 w-5 -translate-y-0.5 place-items-center rounded-full border border-teal-200 bg-white align-middle font-sans text-[9px] font-semibold text-teal-700">
                        {formatNumber(pageAyah.numberInSurah)}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              dir="rtl"
              lang="ar"
              className={cn(
                'quran-text text-center font-normal text-stone-900 transition-[font-size]',
                fontSize === 'huge'
                  ? 'text-[2.0rem] leading-[2.2] sm:text-[2.75rem] sm:leading-[2.4] lg:text-[3.1rem]'
                  : fontSize === 'large'
                    ? 'text-[1.75rem] leading-[2.15] sm:text-[2.4rem] sm:leading-[2.3] lg:text-[2.7rem]'
                    : 'text-[1.5rem] leading-[2.1] sm:text-[2.1rem] sm:leading-[2.2] lg:text-[2.35rem]',
              )}
            >
              {ayah.text}
            </p>
          )}
        </div>

        <div className="mt-3 hidden items-center justify-center gap-3 text-[11px] font-medium text-stone-400 sm:mt-4 sm:flex">
          {pageMode ? (
            <>
              <span>الصفحة {formatNumber(ayah.page)}</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>{formatNumber(displayedPageAyahs.length)} آية</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>الجزء {formatNumber(ayah.juz)}</span>
            </>
          ) : (
            <>
              <span>الآية {formatNumber(ayah.numberInSurah)}</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>الجزء {formatNumber(ayah.juz)}</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>الصفحة {formatNumber(ayah.page)}</span>
            </>
          )}
        </div>
      </div>

      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onClose={closeToast} />
      ) : null}
    </article>
  );
}
