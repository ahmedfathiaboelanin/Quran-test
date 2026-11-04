import { BookOpenCheck, SlidersHorizontal } from 'lucide-react';
import type { PageRange } from '../../types';
import { TOTAL_PAGES } from '../../utils/quranHelpers';
import { formatNumber, formatPageRange } from '../../utils/helpers';
import { Switch } from '../ui/Switch';

interface PageRangePickerProps {
  value: PageRange | null;
  onChange: (range: PageRange | null) => void;
}

const QUICK_RANGES: Array<{ label: string; range: PageRange }> = [
  { label: 'القرآن كامل', range: { from: 1, to: TOTAL_PAGES } },
  { label: 'النصف الأول', range: { from: 1, to: 302 } },
  { label: 'النصف الأخير', range: { from: 303, to: TOTAL_PAGES } },
  { label: 'أول ١٠٠ صفحة', range: { from: 1, to: 100 } },
  { label: 'آخر ١٠٠ صفحة', range: { from: 505, to: TOTAL_PAGES } },
  { label: 'جزء عمّ', range: { from: 582, to: TOTAL_PAGES } },
];

export function PageRangePicker({ value, onChange }: PageRangePickerProps) {
  const isEnabled = value !== null;
  const from = value?.from ?? 1;
  const to = value?.to ?? TOTAL_PAGES;

  const updateFrom = (nextFrom: number) => {
    const safe = Math.min(Math.max(Math.round(nextFrom), 1), TOTAL_PAGES);
    onChange({ from: Math.min(safe, to), to });
  };

  const updateTo = (nextTo: number) => {
    const safe = Math.min(Math.max(Math.round(nextTo), 1), TOTAL_PAGES);
    onChange({ from, to: Math.max(safe, from) });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
        <Switch
          id="enable-page-range"
          checked={isEnabled}
          onChange={(checked) =>
            onChange(checked ? { from: 1, to: TOTAL_PAGES } : null)
          }
          label="تضمين نطاق صفحات"
          description="أضف كل الآيات الواقعة بين صفحتين من المصحف إلى نطاق الاختبار."
        />
      </div>

      {isEnabled ? (
        <div className="space-y-5 rounded-xl border border-teal-100 bg-teal-50/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-900">
              <BookOpenCheck className="h-4 w-4" />
              من الصفحة {formatNumber(from)} إلى الصفحة {formatNumber(to)}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
              {formatNumber(to - from + 1)} صفحة
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span>من صفحة</span>
                <span className="tabular-nums text-teal-700">{formatNumber(from)}</span>
              </span>
              <input
                type="number"
                min={1}
                max={to}
                value={from}
                onChange={(event) => updateFrom(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                aria-label="من صفحة"
              />
              <input
                type="range"
                min={1}
                max={TOTAL_PAGES}
                value={from}
                onChange={(event) => updateFrom(Number(event.target.value))}
                className="w-full accent-teal-600"
                aria-label="اختيار صفحة البداية"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span>إلى صفحة</span>
                <span className="tabular-nums text-teal-700">{formatNumber(to)}</span>
              </span>
              <input
                type="number"
                min={from}
                max={TOTAL_PAGES}
                value={to}
                onChange={(event) => updateTo(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                aria-label="إلى صفحة"
              />
              <input
                type="range"
                min={1}
                max={TOTAL_PAGES}
                value={to}
                onChange={(event) => updateTo(Number(event.target.value))}
                className="w-full accent-teal-600"
                aria-label="اختيار صفحة النهاية"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>
              سيتم تضمين الصفحات {formatPageRange(from, to)} — أي{' '}
              {formatNumber(to - from + 1)} صفحة من المصحف.
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          فعّل النطاق أعلاه أو اختر أحد النطاقات السريعة.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((quickRange) => {
          const isActive =
            isEnabled &&
            quickRange.range.from === from &&
            quickRange.range.to === to;
          return (
            <button
              key={quickRange.label}
              type="button"
              onClick={() => onChange(quickRange.range)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-teal-600 bg-teal-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {quickRange.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
