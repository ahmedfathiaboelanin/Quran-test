import { Bell, CheckCircle2, Clock, RotateCcw, TriangleAlert } from 'lucide-react';
import type { SurahRevisionItem } from '../../types';
import { formatNumber } from '../../utils/helpers';
import { formatPoints } from '../../utils/scoring';

interface RevisionListProps {
  items: SurahRevisionItem[];
}

export function RevisionList({ items }: RevisionListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-900">
            لا توجد سور تحتاج مراجعة عاجلة
          </p>
          <p className="mt-0.5 text-xs leading-6 text-emerald-800/80">
            لم تُسجَّل درجات أخطاء في هذا الاختبار. استمر على المراجعة الدورية.
          </p>
        </div>
      </div>
    );
  }

  const maxPoints = Math.max(...items.map((item) => item.points), 0.5);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const percentage = Math.min(100, Math.max(8, (item.points / maxPoints) * 100));

        return (
          <div
            key={item.surahNumber}
            className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-stone-800">
                  {item.surahName}
                </p>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {formatPoints(item.points)} درجة
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-stone-500">
                <span>{formatNumber(item.questions)} سؤال للمراجعة</span>
                {item.responseMistakes > 0 ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-stone-300" />
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <TriangleAlert className="h-3 w-3" />
                      {formatNumber(item.responseMistakes)} رد خاطئ
                    </span>
                  </>
                ) : null}
                {item.promptMistakes > 0 ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-stone-300" />
                    <span className="inline-flex items-center gap-1 text-violet-600">
                      <Bell className="h-3 w-3" />
                      {formatNumber(item.promptMistakes)} تنبيه
                    </span>
                  </>
                ) : null}
                {item.hesitations > 0 ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-stone-300" />
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Clock className="h-3 w-3" />
                      {formatNumber(item.hesitations)} تردد
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-rose-500 via-amber-500 to-amber-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
