import { ArrowLeft, ListFilter, Plus, Trash2 } from 'lucide-react';
import type { SurahMeta, SurahRange } from '../../types';
import { makeRangeId } from '../../data/presets';
import { formatNumber } from '../../utils/helpers';
import { getSurahRangeLabel } from '../../utils/quranHelpers';

interface CustomRangesPickerProps {
  surahs: SurahMeta[];
  value: SurahRange[];
  onChange: (ranges: SurahRange[]) => void;
}

export function CustomRangesPicker({ surahs, value, onChange }: CustomRangesPickerProps) {
  const addRange = () => {
    onChange([...value, { id: makeRangeId(), fromSurah: 1, toSurah: 1 }]);
  };

  const removeRange = (id: string) => {
    onChange(value.filter((range) => range.id !== id));
  };

  const updateRange = (id: string, patch: Partial<SurahRange>) => {
    onChange(
      value.map((range) => {
        if (range.id !== id) return range;
        const next = { ...range, ...patch };
        if (next.fromSurah > next.toSurah) {
          if (patch.fromSurah !== undefined) next.toSurah = next.fromSurah;
          else next.fromSurah = next.toSurah;
        }
        return next;
      }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <ListFilter className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          <div>
            <p className="text-sm font-semibold text-stone-800">
              نطاقات متعددة في اختبار واحد
            </p>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              مثال: البقرة ← النساء، ثم الحج ← النور، ثم ق ← الناس. تُدمج النطاقات
              وتُحذف الآيات المكررة تلقائيًا.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addRange}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة نطاق
        </button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-stone-600">لا توجد نطاقات مخصصة بعد.</p>
          <p className="mt-1 text-xs text-stone-400">
            اضغط «إضافة نطاق» لاختيار سورة البداية وسورة النهاية.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((range, index) => {
            const surahCount = Math.abs(range.toSurah - range.fromSurah) + 1;
            return (
              <div
                key={range.id}
                className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm shadow-stone-900/[0.02]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-700">
                    النطاق {formatNumber(index + 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRange(range.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    aria-label={`حذف النطاق ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-stone-500">
                      من سورة
                    </span>
                    <select
                      value={range.fromSurah}
                      onChange={(event) =>
                        updateRange(range.id, {
                          fromSurah: Number(event.target.value),
                        })
                      }
                      className="h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm text-stone-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      aria-label="سورة البداية"
                    >
                      {surahs.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {formatNumber(surah.number)}. {surah.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <span className="hidden pb-2.5 text-stone-400 sm:block">
                    <ArrowLeft className="h-4 w-4" />
                  </span>

                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-stone-500">
                      إلى سورة
                    </span>
                    <select
                      value={range.toSurah}
                      onChange={(event) =>
                        updateRange(range.id, {
                          toSurah: Number(event.target.value),
                        })
                      }
                      className="h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm text-stone-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      aria-label="سورة النهاية"
                    >
                      {surahs.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {formatNumber(surah.number)}. {surah.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="mt-2 text-[11px] text-stone-500">
                  {getSurahRangeLabel(range.fromSurah, range.toSurah)} •{' '}
                  {formatNumber(surahCount)} سورة
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
