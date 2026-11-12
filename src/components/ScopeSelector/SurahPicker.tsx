import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { SurahMeta } from '../../types';
import { cn, formatNumber, normalizeArabic } from '../../utils/helpers';
import { getRevelationLabel } from '../../utils/quranHelpers';

interface SurahPickerProps {
  surahs: SurahMeta[];
  value: number[];
  onChange: (surahNumbers: number[]) => void;
}

type SurahCategory = 'all' | 'juz_amma' | 'juz_tabarak' | 'mufassal' | 'meccan' | 'medinan';

const CATEGORIES: Array<{ id: SurahCategory; label: string }> = [
  { id: 'all', label: 'الكل (١١٤)' },
  { id: 'juz_amma', label: 'جزء عم (٧٨–١١٤)' },
  { id: 'juz_tabarak', label: 'جزء تبارك (٦٧–٧٧)' },
  { id: 'mufassal', label: 'المفصّل (٥٠–١١٤)' },
  { id: 'meccan', label: 'مكية' },
  { id: 'medinan', label: 'مدنية' },
];

export function SurahPicker({ surahs, value, onChange }: SurahPickerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SurahCategory>('all');
  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    let list = surahs;

    if (category === 'juz_amma') {
      list = list.filter((s) => s.number >= 78 && s.number <= 114);
    } else if (category === 'juz_tabarak') {
      list = list.filter((s) => s.number >= 67 && s.number <= 77);
    } else if (category === 'mufassal') {
      list = list.filter((s) => s.number >= 50 && s.number <= 114);
    } else if (category === 'meccan') {
      list = list.filter((s) => s.revelationType === 'Meccan');
    } else if (category === 'medinan') {
      list = list.filter((s) => s.revelationType === 'Medinan');
    }

    const normalizedQuery = normalizeArabic(query);
    if (!normalizedQuery) return list;

    return list.filter((surah) => {
      const name = normalizeArabic(surah.name);
      const english = surah.englishName.toLowerCase();
      const translation = surah.englishNameTranslation.toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        english.includes(normalizedQuery) ||
        translation.includes(normalizedQuery) ||
        String(surah.number) === normalizedQuery
      );
    });
  }, [category, query, surahs]);

  const toggleSurah = (surahNumber: number) => {
    if (selected.has(surahNumber)) {
      onChange(value.filter((number) => number !== surahNumber));
    } else {
      onChange([...value, surahNumber].sort((a, b) => a - b));
    }
  };

  const selectAllFiltered = () => {
    const combined = new Set([...value, ...filtered.map((s) => s.number)]);
    onChange(Array.from(combined).sort((a, b) => a - b));
  };

  const deselectAllFiltered = () => {
    const toRemove = new Set(filtered.map((s) => s.number));
    onChange(value.filter((n) => !toRemove.has(n)));
  };

  const isAllFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.number));

  return (
    <div className="space-y-3.5">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              category === cat.id
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم السورة أو رقمها..."
            className="h-10 w-full rounded-xl border border-stone-300 bg-white pr-9 pl-9 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            aria-label="البحث في السور"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute left-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="مسح البحث"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {category !== 'all' || query ? (
            <button
              type="button"
              onClick={isAllFilteredSelected ? deselectAllFiltered : selectAllFiltered}
              className="rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
            >
              {isAllFilteredSelected ? 'إلغاء المعروض' : 'تحديد المعروض'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange(surahs.map((surah) => surah.number))}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              تحديد الكل
            </button>
          )}
          <span className="h-4 w-px bg-stone-200" />
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
          >
            مسح ({formatNumber(value.length)})
          </button>
        </div>
      </div>

      <div className="max-h-[24rem] overflow-y-auto overscroll-contain pl-1">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
            لا توجد سورة تطابق بحثك.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((surah) => {
              const isSelected = selected.has(surah.number);
              return (
                <button
                  key={surah.number}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleSurah(surah.number)}
                  className={cn(
                    'group flex min-h-16 items-center gap-3 rounded-xl border p-2.5 text-right transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-teal-500 bg-teal-50/80 shadow-sm shadow-teal-900/5'
                      : 'border-stone-200 bg-white hover:border-teal-300 hover:bg-teal-50/30',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums transition-colors',
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-stone-100 text-stone-600 group-hover:bg-teal-100 group-hover:text-teal-800',
                    )}
                  >
                    {formatNumber(surah.number)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-800">
                      {surah.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-stone-500">
                      {formatNumber(surah.numberOfAyahs)} آية •{' '}
                      {getRevelationLabel(surah.revelationType)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-stone-300 bg-white text-transparent',
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-stone-500">
        {value.length > 0
          ? `تم اختيار ${formatNumber(value.length)} سورة. يمكنك اختيار أكثر من سورة.`
          : 'اختر سورة واحدة أو أكثر، أو استخدم الاختيارات السريعة بالأعلى.'}
        {filtered.length !== surahs.length
          ? ` — يُعرض الآن ${formatNumber(filtered.length)} من أصل ${formatNumber(surahs.length)} سورة.`
          : ''}
      </p>
    </div>
  );
}
