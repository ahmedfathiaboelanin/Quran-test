import { Check, Layers3 } from 'lucide-react';
import type { JuzSummary } from '../../types';
import { cn, formatNumber } from '../../utils/helpers';

interface JuzPickerProps {
  juzSummaries: JuzSummary[];
  value: number[];
  onChange: (juzNumbers: number[]) => void;
}

export function JuzPicker({ juzSummaries, value, onChange }: JuzPickerProps) {
  const selected = new Set(value);

  const toggleJuz = (juzNumber: number) => {
    if (selected.has(juzNumber)) {
      onChange(value.filter((number) => number !== juzNumber));
    } else {
      onChange([...value, juzNumber].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-600">
          <Layers3 className="h-4 w-4 text-teal-600" />
          اختر جزءًا واحدًا أو أكثر
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(juzSummaries.map((juz) => juz.number))}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
          >
            تحديد الكل
          </button>
          <span className="h-4 w-px bg-stone-200" />
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
          >
            مسح
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {juzSummaries.map((juz) => {
          const isSelected = selected.has(juz.number);
          const sameSurah = juz.firstSurahName === juz.lastSurahName;
          return (
            <button
              key={juz.number}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleJuz(juz.number)}
              title={`الجزء ${juz.number}: ${juz.firstSurahName} — ${juz.lastSurahName}`}
              className={cn(
                'group relative flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-right transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-teal-500 bg-teal-50 shadow-sm shadow-teal-900/5'
                  : 'border-stone-200 bg-white hover:border-teal-300 hover:bg-teal-50/30',
              )}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg text-xs font-bold',
                    isSelected
                      ? 'bg-teal-700 text-white'
                      : 'bg-stone-100 text-stone-600 group-hover:bg-teal-100',
                  )}
                >
                  {formatNumber(juz.number)}
                </span>
                <span className="text-[10px] font-medium text-stone-400">
                  {formatNumber(juz.ayahCount)} آية
                </span>
              </span>

              <span className="mt-2 block w-full">
                <span className="block text-[11px] font-semibold text-stone-500">
                  الجزء {formatNumber(juz.number)}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-5 text-stone-700">
                  {sameSurah
                    ? juz.firstSurahName
                    : `${juz.firstSurahName} ← ${juz.lastSurahName}`}
                </span>
              </span>

              {isSelected ? (
                <span className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-teal-600 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-stone-500">
        {value.length > 0
          ? `تم اختيار ${formatNumber(value.length)} من أصل ٣٠ جزءًا.`
          : 'لم يتم اختيار أي جزء بعد.'}
      </p>
    </div>
  );
}
