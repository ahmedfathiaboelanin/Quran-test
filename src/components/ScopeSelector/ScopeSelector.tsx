import { useMemo } from 'react';
import {
  BookOpen,
  Check,
  Files,
  Layers3,
  ListFilter,
  Plus,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import type {
  JuzSummary,
  ScopeSelection,
  ScopeStats,
  ScopeTab,
  SurahMeta,
} from '../../types';
import {
  cloneSelection,
  EMPTY_SELECTION,
  mergeSelections,
  SCOPE_PRESETS,
} from '../../data/presets';
import { cn, formatNumber } from '../../utils/helpers';
import { resolveScope } from '../../utils/quranHelpers';
import { SurahPicker } from './SurahPicker';
import { PageRangePicker } from './PageRangePicker';
import { JuzPicker } from './JuzPicker';
import { CustomRangesPicker } from './CustomRangesPicker';
import { ScopeSummary } from './ScopeSummary';

interface ScopeSelectorProps {
  surahs: SurahMeta[];
  juzSummaries: JuzSummary[];
  selection: ScopeSelection;
  stats: ScopeStats;
  activeTab: ScopeTab;
  onChange: (selection: ScopeSelection) => void;
  onActiveTabChange: (tab: ScopeTab) => void;
}

const TABS: Array<{
  id: ScopeTab;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: 'surah', label: 'السور', icon: BookOpen },
  { id: 'pages', label: 'الصفحات', icon: Files },
  { id: 'juz', label: 'الأجزاء', icon: Layers3 },
  { id: 'ranges', label: 'نطاقات مخصصة', icon: ListFilter },
];

const QUICK_PRESETS = SCOPE_PRESETS.filter((preset) => preset.id === 'mufassal');

export function ScopeSelector({
  surahs,
  juzSummaries,
  selection,
  stats,
  activeTab,
  onChange,
  onActiveTabChange,
}: ScopeSelectorProps) {
  const counts: Record<ScopeTab, number> = {
    surah: selection.surahNumbers.length,
    pages: selection.pageRange ? 1 : 0,
    juz: selection.juzNumbers.length,
    ranges: selection.customRanges.length,
  };

  const selectedAyahs = useMemo(
    () => new Set(resolveScope(selection).map((ayah) => ayah.number)),
    [selection],
  );

  const activePresets = useMemo(() => {
    const active: Record<string, boolean> = {};
    for (const preset of QUICK_PRESETS) {
      const presetAyahs = resolveScope(preset.selection);
      active[preset.id] =
        presetAyahs.length > 0 &&
        presetAyahs.every((ayah) => selectedAyahs.has(ayah.number));
    }
    return active;
  }, [selectedAyahs]);

  const applyPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    if (activePresets[preset.id]) {
      const pSel = preset.selection;
      const removeSurahs = new Set(pSel.surahNumbers);
      const removeJuz = new Set(pSel.juzNumbers);
      onChange({
        surahNumbers: selection.surahNumbers.filter((n) => !removeSurahs.has(n)),
        juzNumbers: selection.juzNumbers.filter((n) => !removeJuz.has(n)),
        pageRange:
          selection.pageRange &&
          pSel.pageRange &&
          selection.pageRange.from === pSel.pageRange.from &&
          selection.pageRange.to === pSel.pageRange.to
            ? null
            : selection.pageRange,
        customRanges: selection.customRanges.filter(
          (cr) =>
            !pSel.customRanges.some(
              (pcr) => pcr.fromSurah === cr.fromSurah && pcr.toSurah === cr.toSurah,
            ),
        ),
      });
    } else {
      onChange(mergeSelections(selection, preset.selection));
      onActiveTabChange(preset.tab);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-stone-300/70 bg-[#fbf7ee]/85 shadow-[0_18px_40px_-34px_rgba(24,37,31,0.5)] backdrop-blur">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-amber-500/60 to-transparent"
        aria-hidden="true"
      />
      <div className="border-b border-stone-300/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
              <span className="step-mark">١</span>
              الخطوة الأولى
            </p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">نطاق الاختبار</h2>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-stone-500">
              يمكنك الجمع بين أكثر من نطاق — ستُدمج الاختيارات وتُحذف التكرارات
              تلقائيًا قبل توزيع الأسئلة. الاختيار السريع يُضاف إلى نطاقك الحالي
              بدلًا من استبداله.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(cloneSelection(EMPTY_SELECTION))}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تعيين
          </button>
        </div>

        <div className="mt-4">
          <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-600">
            <Wand2 className="h-3.5 w-3.5 text-amber-600" />
            اختيار سريع
            <span className="font-normal text-stone-400">
              — اضغط لإضافته إلى النطاق الحالي
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map((preset) => {
              const isActive = activePresets[preset.id] ?? false;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={
                    isActive
                      ? `${preset.description} — مضاف بالفعل إلى النطاق`
                      : `${preset.description} — اضغط للإضافة`
                  }
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                    isActive
                      ? 'border-teal-700 bg-teal-700 text-white shadow-sm shadow-teal-950/20'
                      : 'border-stone-300/80 bg-[#fbf7ee] text-stone-600 hover:border-amber-400/70 hover:bg-amber-50 hover:text-amber-900',
                  )}
                >
                  {isActive ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  )}
                  {preset.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-400">
            مثال: أضف «المفصل» ثم فعّل نطاق صفحات «النصف الأول» — سيُختبر
            المجموع دون تكرار.
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div
          role="tablist"
          aria-label="طرق تحديد نطاق الاختبار"
          className="flex gap-1 overflow-x-auto rounded-lg border border-stone-300/50 bg-stone-200/45 p-1"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`scope-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`scope-panel-${tab.id}`}
                onClick={() => onActiveTabChange(tab.id)}
                className={cn(
                  'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-semibold transition sm:text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                  isActive
                    ? 'bg-[#fbf7ee] text-teal-800 shadow-sm ring-1 ring-stone-300/60'
                    : 'text-stone-500 hover:bg-[#fbf7ee]/50 hover:text-stone-800',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {counts[tab.id] > 0 ? (
                  <span
                    className={cn(
                      'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                      isActive
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-stone-200 text-stone-600',
                    )}
                  >
                    {formatNumber(counts[tab.id])}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {activeTab === 'surah' ? (
            <div
              role="tabpanel"
              id="scope-panel-surah"
              aria-labelledby="scope-tab-surah"
            >
              <SurahPicker
                surahs={surahs}
                value={selection.surahNumbers}
                onChange={(surahNumbers) => onChange({ ...selection, surahNumbers })}
              />
            </div>
          ) : null}

          {activeTab === 'pages' ? (
            <div
              role="tabpanel"
              id="scope-panel-pages"
              aria-labelledby="scope-tab-pages"
            >
              <PageRangePicker
                value={selection.pageRange}
                onChange={(pageRange) => onChange({ ...selection, pageRange })}
              />
            </div>
          ) : null}

          {activeTab === 'juz' ? (
            <div role="tabpanel" id="scope-panel-juz" aria-labelledby="scope-tab-juz">
              <JuzPicker
                juzSummaries={juzSummaries}
                value={selection.juzNumbers}
                onChange={(juzNumbers) => onChange({ ...selection, juzNumbers })}
              />
            </div>
          ) : null}

          {activeTab === 'ranges' ? (
            <div
              role="tabpanel"
              id="scope-panel-ranges"
              aria-labelledby="scope-tab-ranges"
            >
              <CustomRangesPicker
                surahs={surahs}
                value={selection.customRanges}
                onChange={(customRanges) => onChange({ ...selection, customRanges })}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <ScopeSummary stats={stats} />
        </div>
      </div>
    </section>
  );
}
