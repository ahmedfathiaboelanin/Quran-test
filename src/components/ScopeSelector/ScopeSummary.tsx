import { BookOpenText, Files, Layers3, Sparkles } from 'lucide-react';
import type { ScopeStats } from '../../types';
import { formatNumber } from '../../utils/helpers';

interface ScopeSummaryProps {
  stats: ScopeStats;
}

export function ScopeSummary({ stats }: ScopeSummaryProps) {
  const isEmpty = stats.ayahCount === 0;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isEmpty
          ? 'border-dashed border-stone-300 bg-stone-50/60'
          : 'border-teal-200 bg-teal-50/60'
      }`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-stone-800">
          <Sparkles className={`h-4 w-4 ${isEmpty ? 'text-stone-400' : 'text-teal-600'}`} />
          ملخص النطاق المحدد
        </span>
        {!isEmpty ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
            بعد حذف التكرارات
          </span>
        ) : null}
      </div>

      {isEmpty ? (
        <p className="mt-2 text-xs leading-6 text-stone-500">
          لم تحدد أي نطاق بعد. اختر سورًا أو صفحات أو أجزاء أو أضف نطاقًا مخصصًا.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/80 px-3 py-2.5 text-center ring-1 ring-teal-100">
            <span className="mx-auto flex items-center justify-center gap-1 text-[10px] font-semibold text-stone-500">
              <BookOpenText className="h-3 w-3" />
              الآيات
            </span>
            <span className="mt-0.5 block text-lg font-bold tabular-nums text-teal-800">
              {formatNumber(stats.ayahCount)}
            </span>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2.5 text-center ring-1 ring-teal-100">
            <span className="mx-auto flex items-center justify-center gap-1 text-[10px] font-semibold text-stone-500">
              <Files className="h-3 w-3" />
              الصفحات
            </span>
            <span className="mt-0.5 block text-lg font-bold tabular-nums text-teal-800">
              {formatNumber(stats.pageCount)}
            </span>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2.5 text-center ring-1 ring-teal-100">
            <span className="mx-auto flex items-center justify-center gap-1 text-[10px] font-semibold text-stone-500">
              <Layers3 className="h-3 w-3" />
              السور
            </span>
            <span className="mt-0.5 block text-lg font-bold tabular-nums text-teal-800">
              {formatNumber(stats.surahCount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
