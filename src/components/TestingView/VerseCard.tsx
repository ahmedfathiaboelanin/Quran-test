import { BookOpenText, Eye, EyeOff, FileText, Layers3, Sparkles } from 'lucide-react';
import type { AyahRef } from '../../types';
import { formatNumber } from '../../utils/helpers';
import { getAyahReferenceLabel } from '../../utils/quranHelpers';

interface VerseCardProps {
  ayah: AyahRef;
  isHidden: boolean;
  isQuestionStart: boolean;
  offsetFromStart: number;
  onReveal: () => void;
}

export function VerseCard({
  ayah,
  isHidden,
  isQuestionStart,
  offsetFromStart,
  onReveal,
}: VerseCardProps) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-[#fffdf7] shadow-lg shadow-teal-950/[0.06]"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_15%_10%,#99f6e4_0,transparent_32%),radial-gradient(circle_at_85%_90%,#fde68a_0,transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-4 top-4 bottom-4 rounded-2xl border border-teal-800/10" />
      <div className="pointer-events-none absolute inset-x-6 top-6 bottom-6 rounded-xl border border-dashed border-teal-800/10" />

      <div className="relative px-5 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-700 text-white shadow-sm">
              <BookOpenText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900">
                {getAyahReferenceLabel(ayah)}
              </p>
              <p className="text-[10px] text-stone-500">{ayah.surahEnglishName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {isQuestionStart ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-2.5 py-1 text-[10px] font-bold text-white">
                <Sparkles className="h-3 w-3" />
                بداية السؤال
              </span>
            ) : offsetFromStart > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                +{formatNumber(offsetFromStart)} آية من البداية
              </span>
            ) : (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                {formatNumber(Math.abs(offsetFromStart))} آية قبل البداية
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600">
              <FileText className="h-3 w-3" />
              صفحة {formatNumber(ayah.page)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600">
              <Layers3 className="h-3 w-3" />
              الجزء {formatNumber(ayah.juz)}
            </span>
          </div>
        </div>

        <div className="relative mt-6 min-h-44 sm:min-h-52">
          {isHidden ? (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-teal-200 bg-white/70 px-4 py-8 text-center sm:min-h-52">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-700">
                <EyeOff className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-700">النص مخفي</p>
                <p className="mt-1 text-xs text-stone-500">
                  اسمع تلاوة المختبر ثم اضغط لإظهار الآية والتحقق منها.
                </p>
              </div>
              <button
                type="button"
                onClick={onReveal}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <Eye className="h-3.5 w-3.5" />
                إظهار نص الآية
              </button>
            </div>
          ) : (
            <p
              dir="rtl"
              lang="ar"
              className="quran-text text-center text-[1.7rem] font-normal text-stone-900 sm:text-[2.1rem] lg:text-[2.35rem]"
            >
              {ayah.text}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-medium text-stone-400">
          <span>الآية {formatNumber(ayah.numberInSurah)}</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>الجزء {formatNumber(ayah.juz)}</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>الصفحة {formatNumber(ayah.page)}</span>
        </div>
      </div>
    </article>
  );
}
