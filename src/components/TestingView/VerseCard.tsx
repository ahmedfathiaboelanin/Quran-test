import { BookOpenText, Eye, EyeOff, FileText, Layers3, Sparkles } from 'lucide-react';
import type { AyahRef } from '../../types';
import { cn, formatNumber } from '../../utils/helpers';
import { getAyahReferenceLabel } from '../../utils/quranHelpers';

interface VerseCardProps {
  ayah: AyahRef;
  /** When provided, the entire mushaf page is rendered instead of one ayah. */
  pageAyahs?: AyahRef[];
  questionStartAyahNumber: number;
  isHidden: boolean;
  isQuestionStart: boolean;
  offsetFromStart: number;
  onReveal: () => void;
}

export function VerseCard({
  ayah,
  pageAyahs,
  questionStartAyahNumber,
  isHidden,
  isQuestionStart,
  offsetFromStart,
  onReveal,
}: VerseCardProps) {
  const pageMode = Boolean(pageAyahs);
  const displayedPageAyahs = pageAyahs?.length ? pageAyahs : [ayah];

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-[#fffdf7] shadow-lg shadow-teal-950/[0.06]"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_15%_10%,#99f6e4_0,transparent_32%),radial-gradient(circle_at_85%_90%,#fde68a_0,transparent_30%)] dark:opacity-[0.18]" />
      <div className="pointer-events-none absolute inset-x-4 top-4 bottom-4 rounded-2xl border border-teal-800/10" />
      <div className="pointer-events-none absolute inset-x-6 top-6 bottom-6 rounded-xl border border-dashed border-teal-800/10" />

      <div className="relative px-4 pb-3 pt-4 sm:px-8 sm:pb-7 sm:pt-8">
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
            {pageMode ? (
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
              className="quran-text text-center text-[1.3rem] leading-[2.15] text-stone-900 sm:text-[1.7rem] sm:leading-[2.2] lg:text-[1.9rem]"
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
              className="quran-text text-center text-[1.5rem] font-normal text-stone-900 sm:text-[2.1rem] lg:text-[2.35rem]"
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
    </article>
  );
}
