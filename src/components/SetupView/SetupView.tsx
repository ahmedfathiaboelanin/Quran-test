import { useMemo, useState } from 'react';
import {
  BookOpenText,
  EyeOff,
  FileText,
  Info,
  ListChecks,
  Minus,
  Play,
  Plus,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import type {
  DistributionUnit,
  JuzSummary,
  QuestionDisplayMode,
  ScopeSelection,
  ScopeTab,
  SurahMeta,
  TestConfig,
} from '../../types';
import { cloneSelection, EMPTY_SELECTION } from '../../data/presets';
import { formatNumber } from '../../utils/helpers';
import { getScopeStats } from '../../utils/quranHelpers';
import { ScopeSelector } from '../ScopeSelector/ScopeSelector';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';

interface SetupViewProps {
  surahs: SurahMeta[];
  juzSummaries: JuzSummary[];
  initialConfig: TestConfig | null;
  onStart: (config: TestConfig) => void;
}

function inferScopeTab(selection: ScopeSelection): ScopeTab {
  if (selection.surahNumbers.length > 0) return 'surah';
  if (selection.juzNumbers.length > 0) return 'juz';
  if (selection.customRanges.length > 0) return 'ranges';
  if (selection.pageRange) return 'pages';
  return 'surah';
}

const DISTRIBUTION_OPTIONS: Array<{
  id: DistributionUnit;
  label: string;
  description: string;
  icon: typeof Shuffle;
}> = [
  {
    id: 'auto',
    label: 'تلقائي (موصى به)',
    description: 'يوزّع على الصفحات إن أمكن، وإلا فعلى الآيات.',
    icon: Shuffle,
  },
  {
    id: 'page',
    label: 'حسب الصفحات',
    description: 'سؤال من كل شريحة صفحات لتغطية أفقية كاملة.',
    icon: FileText,
  },
  {
    id: 'ayah',
    label: 'حسب الآيات',
    description: 'سؤال من كل شريحة آيات — مناسب للنطاقات الصغيرة.',
    icon: ListChecks,
  },
];

const DISPLAY_OPTIONS: Array<{
  id: QuestionDisplayMode;
  label: string;
  description: string;
  icon: typeof BookOpenText;
}> = [
  {
    id: 'ayah',
    label: 'آية واحدة',
    description: 'اعرض آية البداية فقط مع إمكانية التنقل بين الآيات.',
    icon: BookOpenText,
  },
  {
    id: 'page',
    label: 'الصفحة كاملة',
    description: 'اعرض كل آيات الصفحة التي تبدأ منها الآية مع تمييز البداية.',
    icon: FileText,
  },
];

const QUICK_COUNTS = [5, 10, 15, 20, 30, 50];

export function SetupView({
  surahs,
  juzSummaries,
  initialConfig,
  onStart,
}: SetupViewProps) {
  const [selection, setSelection] = useState<ScopeSelection>(() =>
    initialConfig ? cloneSelection(initialConfig.scope) : cloneSelection(EMPTY_SELECTION),
  );
  const [activeTab, setActiveTab] = useState<ScopeTab>(() =>
    initialConfig ? inferScopeTab(initialConfig.scope) : 'surah',
  );
  const [questionCount, setQuestionCount] = useState(
    initialConfig?.questionCount ?? 10,
  );
  const [distributionUnit, setDistributionUnit] = useState<DistributionUnit>(
    initialConfig?.distributionUnit ?? 'auto',
  );
  const [displayMode, setDisplayMode] = useState<QuestionDisplayMode>(
    initialConfig?.displayMode ?? 'ayah',
  );
  const [randomizeQuestionOrder, setRandomizeQuestionOrder] = useState(
    initialConfig?.randomizeQuestionOrder ?? false,
  );
  const [blindMode, setBlindMode] = useState(initialConfig?.blindMode ?? false);

  const stats = useMemo(() => getScopeStats(selection), [selection]);
  const plannedCount = Math.min(questionCount, stats.ayahCount);
  const canStart = stats.ayahCount > 0 && plannedCount > 0;

  const usePageDistribution =
    distributionUnit !== 'ayah' &&
    stats.pageCount > 0 &&
    stats.pageCount >= plannedCount;
  const segmentSize = usePageDistribution
    ? Math.ceil(stats.pageCount / Math.max(plannedCount, 1))
    : Math.ceil(stats.ayahCount / Math.max(plannedCount, 1));

  const changeCount = (value: number) => {
    if (!Number.isFinite(value)) return;
    setQuestionCount(Math.min(Math.max(Math.round(value), 1), 9999));
  };

  const handleStart = () => {
    if (!canStart) return;
    onStart({
      scope: cloneSelection(selection),
      questionCount: plannedCount,
      distributionUnit,
      displayMode,
      randomizeQuestionOrder,
      blindMode,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <ScopeSelector
        surahs={surahs}
        juzSummaries={juzSummaries}
        selection={selection}
        stats={stats}
        activeTab={activeTab}
        onChange={setSelection}
        onActiveTabChange={setActiveTab}
      />

      <aside className="space-y-4 lg:sticky lg:top-24">
        <section className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-sm shadow-stone-900/[0.03] sm:p-6">
          <p className="text-[11px] font-bold tracking-wide text-teal-700">
            الخطوة الثانية
          </p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">إعدادات الاختبار</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="question-count"
                  className="text-sm font-semibold text-stone-800"
                >
                  عدد الأسئلة
                </label>
                <span className="text-[11px] text-stone-400">
                  الحد الأقصى {formatNumber(stats.ayahCount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeCount(questionCount - 1)}
                  disabled={questionCount <= 1}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
                  aria-label="تقليل عدد الأسئلة"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="question-count"
                  type="number"
                  min={1}
                  max={9999}
                  value={questionCount}
                  onChange={(event) => changeCount(Number(event.target.value))}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-center text-lg font-bold tabular-nums text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => changeCount(questionCount + 1)}
                  disabled={questionCount >= 9999}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
                  aria-label="زيادة عدد الأسئلة"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => changeCount(count)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      questionCount === count
                        ? 'bg-teal-700 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-teal-50 hover:text-teal-800'
                    }`}
                  >
                    {formatNumber(count)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-stone-800">
                أساس التوزيع
              </span>
              <div className="space-y-2">
                {DISTRIBUTION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = distributionUnit === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setDistributionUnit(option.id)}
                      className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-right transition ${
                        isActive
                          ? 'border-teal-500 bg-teal-50/70'
                          : 'border-stone-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                          isActive
                            ? 'bg-teal-700 text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-stone-800">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-5 text-stone-500">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-stone-800">
                طريقة عرض السؤال
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DISPLAY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = displayMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setDisplayMode(option.id)}
                      className={`rounded-xl border p-2.5 text-right transition ${
                        isActive
                          ? 'border-teal-500 bg-teal-50/70'
                          : 'border-stone-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <span
                        className={`mb-1.5 grid h-7 w-7 place-items-center rounded-lg ${
                          isActive
                            ? 'bg-teal-700 text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="block text-xs font-bold text-stone-800">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-stone-500">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <Switch
                id="randomize-question-order"
                checked={randomizeQuestionOrder}
                onChange={setRandomizeQuestionOrder}
                label="ترتيب عشوائي للأسئلة"
                description="بعثر ترتيب الأسئلة بدلًا من ترتيب المصحف، مع الحفاظ على توزيعها العادل."
              />
              <div className="h-px bg-stone-200" />
              <Switch
                id="blind-mode"
                checked={blindMode}
                onChange={setBlindMode}
                label="وضع الاختبار الأعمى"
                description={
                  displayMode === 'page'
                    ? 'إخفاء نص الصفحة حتى يضغط المختبر على «إظهار النص».'
                    : 'إخفاء نص الآية حتى يضغط المختبر على «إظهار النص».'
                }
              />
              <p className="flex items-start gap-1.5 text-[10px] leading-5 text-stone-400">
                <EyeOff className="mt-0.5 h-3 w-3 shrink-0" />
                يمكنك تغيير وضع الإخفاء في أي وقت أثناء الاختبار.
              </p>
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs leading-6 text-teal-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                {canStart
                  ? `سيتم إنشاء ${formatNumber(plannedCount)} سؤالًا`
                  : 'اختر نطاقًا للبدء'}
              </p>
              {canStart ? (
                <>
                  <p className="mt-0.5 text-[11px] text-teal-800/80">
                    {usePageDistribution
                      ? `توزيع على الصفحات: سؤال من كل ${formatNumber(segmentSize)} صفحة تقريبًا.`
                      : `توزيع على الآيات: سؤال من كل ${formatNumber(segmentSize)} آية تقريبًا.`}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-teal-800/75">
                    {displayMode === 'page' ? 'عرض الصفحة كاملة' : 'عرض آية واحدة'}
                    {randomizeQuestionOrder ? ' • ترتيب عشوائي' : ' • ترتيب المصحف'}
                  </p>
                </>
              ) : null}
            </div>

            {questionCount > stats.ayahCount && stats.ayahCount > 0 ? (
              <p className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                عدد الأسئلة أكبر من عدد الآيات المتاحة، لذلك سيتم إنشاء{' '}
                {formatNumber(stats.ayahCount)} سؤالًا كحد أقصى.
              </p>
            ) : null}

            <Button
              size="lg"
              className="w-full"
              disabled={!canStart}
              onClick={handleStart}
            >
              <Play className="h-4 w-4" />
              ابدأ الاختبار
            </Button>

            {!canStart ? (
              <p className="text-center text-[11px] leading-5 text-stone-400">
                حدّد نطاقًا يحتوي على آية واحدة على الأقل لبدء الاختبار.
              </p>
            ) : null}
          </div>
        </section>

        <div className="rounded-2xl border border-stone-200/70 bg-white/50 p-4 text-[11px] leading-6 text-stone-500">
          <p className="flex items-center gap-1.5 font-bold text-stone-700">
            <Info className="h-3.5 w-3.5 text-teal-600" />
            لماذا التوزيع العادل؟
          </p>
          <p className="mt-1">
            تُقسَّم الآيات أو الصفحات إلى شرائح متساوية، ثم يُختار سؤال عشوائي من كل
            شريحة. بهذا لا تتركز الأسئلة في بداية النطاق أو نهايته، ويشمل الاختبار
            كامل المحفوظ.
          </p>
        </div>
      </aside>
    </div>
  );
}
