import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Info,
  Minus,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type {
  JuzSummary,
  ScopeSelection,
  ScopeTab,
  SurahMeta,
  TestConfig,
} from '../../types';
import { cloneSelection, EMPTY_SELECTION } from '../../data/presets';
import { cn, formatNumber } from '../../utils/helpers';
import { getScopeStats } from '../../utils/quranHelpers';
import { ScopeSelector } from '../ScopeSelector/ScopeSelector';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ExamineePicker } from './ExamineePicker';
import type { ExamineeSelection } from './ExamineePicker';

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

export function SetupView({
  surahs,
  juzSummaries,
  initialConfig,
  onStart,
}: SetupViewProps) {
  const [selection, setSelection] = useState<ScopeSelection>(() =>
    initialConfig ? cloneSelection(initialConfig.scope) : cloneSelection(EMPTY_SELECTION),
  );
  const [studentName, setStudentName] = useState(initialConfig?.studentName ?? '');
  const [examineeId, setExamineeId] = useState(initialConfig?.examineeId ?? '');
  const [activeTab, setActiveTab] = useState<ScopeTab>(() =>
    initialConfig ? inferScopeTab(initialConfig.scope) : 'surah',
  );
  const [questionCount, setQuestionCount] = useState(
    initialConfig?.questionCount ?? 10,
  );
  const [resetOpen, setResetOpen] = useState(false);

  const stats = useMemo(() => getScopeStats(selection), [selection]);
  const plannedCount = Math.min(questionCount, stats.ayahCount);
  const canStart = stats.ayahCount > 0 && plannedCount > 0;
  const countSliderMax = Math.max(
    1,
    Math.min(9999, stats.ayahCount > 0 ? stats.ayahCount : 100),
  );

  const usePageDistribution =
    stats.pageCount > 0 && stats.pageCount >= plannedCount;
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
      studentName: studentName.trim() || undefined,
      examineeId: examineeId || undefined,
      scope: cloneSelection(selection),
      questionCount: plannedCount,
      distributionUnit: 'auto',
      displayMode: 'ayah',
      randomizeQuestionOrder: true,
      blindMode: false,
    });
  };

  const scrollToSettings = () => {
    const el = document.getElementById('test-settings-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const onFloatingStartClick = () => {
    if (!canStart) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    handleStart();
  };

  const handleResetAll = () => {
    setSelection(cloneSelection(EMPTY_SELECTION));
    setStudentName('');
    setExamineeId('');
    setActiveTab('surah');
    setQuestionCount(10);
  };

  const hasCustomization =
    stats.ayahCount > 0 ||
    studentName.trim().length > 0 ||
    examineeId.length > 0 ||
    questionCount !== 10;

  const requestResetAll = () => {
    if (!hasCustomization) return;
    setResetOpen(true);
  };

  return (
    <div className="grid gap-5 pb-28 sm:pb-32 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
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
        <section
          id="test-settings-section"
          className="relative overflow-hidden rounded-2xl border border-stone-300/70 bg-[#fbf7ee]/90 p-5 shadow-[0_18px_40px_-34px_rgba(24,37,31,0.55)] sm:p-6"
        >
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-amber-500/60 to-transparent"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
                <span className="step-mark">٢</span>
                الخطوة الثانية
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">إعدادات الاختبار</h2>
            </div>
            <button
              type="button"
              onClick={requestResetAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-200"
              title="إعادة تعيين كافة النطاقات والاسم والإعدادات"
              aria-label="إعادة تعيين كافة النطاقات والاسم والإعدادات"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة تعيين الكل</span>
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <ExamineePicker
                value={{ examineeId, studentName }}
                onChange={(selection: ExamineeSelection) => {
                  setExamineeId(selection.examineeId);
                  setStudentName(selection.studentName);
                }}
              />
            </div>

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

              <input
                type="range"
                min={1}
                max={countSliderMax}
                step={1}
                value={Math.min(questionCount, countSliderMax)}
                onChange={(event) => changeCount(Number(event.target.value))}
                disabled={stats.ayahCount === 0}
                className="range-slider mt-2.5"
                aria-label="اختيار عدد الأسئلة بالسحب"
                title={
                  stats.ayahCount > 0
                    ? `اسحب لاختيار عدد الأسئلة (حتى ${formatNumber(stats.ayahCount)})`
                    : 'حدّد نطاقًا أولًا لتفعيل شريط عدد الأسئلة'
                }
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400">
                <span>١</span>
                <span>{formatNumber(stats.ayahCount)} آية متاحة</span>
              </div>
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs leading-6 text-teal-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                {canStart
                  ? `سيتم إنشاء ${formatNumber(plannedCount)} سؤالًا`
                  : 'اختر نطاقًا للبدء'}
              </p>
              {canStart ? (
                <p className="mt-0.5 text-[11px] text-teal-800/80">
                  {usePageDistribution
                    ? `توزيع على الصفحات: سؤال من كل ${formatNumber(segmentSize)} صفحة تقريبًا.`
                    : `توزيع على الآيات: سؤال من كل ${formatNumber(segmentSize)} آية تقريبًا.`}
                </p>
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
      </aside>

      <ConfirmDialog
        open={resetOpen}
        title="إعادة تعيين كل الإعدادات؟"
        description="سيتم مسح النطاق المحدد واسم المختبَر وكل خيارات الاختبار والعودة إلى الوضع الافتراضي. لا يمكن التراجع عن هذه الخطوة."
        confirmLabel="نعم، أعد التعيين"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleResetAll}
        onClose={() => setResetOpen(false)}
      />

      {/* شريط البدء العائم المتاح على كل الشاشات عبر createPortal لضمان ثباته فوق أي تحريك لصفحة الإعدادات */}
      {createPortal(
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-400/35 bg-[#10251e]/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-[#f4eedf] shadow-[0_-14px_40px_rgba(9,20,16,0.35)] backdrop-blur-xl print:hidden"
          dir="rtl"
          role="region"
          aria-label="شريط بدء الاختبار"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition',
                  canStart
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                    : 'border-stone-600/60 bg-stone-700/30 text-stone-400',
                )}
              >
                <Sparkles className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#f7f2e6] sm:text-sm">
                  {canStart
                    ? stats.surahCount > 0
                      ? `${formatNumber(stats.surahCount)} سورة محددة (${formatNumber(stats.ayahCount)} آية)`
                      : stats.pageCount > 0
                        ? `${formatNumber(stats.pageCount)} صفحة محددة (${formatNumber(stats.ayahCount)} آية)`
                        : `${formatNumber(stats.ayahCount)} آية في النطاق`
                    : 'اختر سورة أو جزءاً لبدء الاختبار'}
                </p>
                <p className="flex items-center gap-2 text-[11px] text-stone-400">
                  <span>
                    {canStart
                      ? `${formatNumber(plannedCount)} سؤال مخطط`
                      : 'حدد نطاق التسميع أولاً'}
                  </span>
                  {studentName.trim() ? (
                    <>
                      <span className="h-1 w-1 rounded-full bg-amber-500/70" />
                      <span className="truncate font-semibold text-amber-300">
                        المختبَر: {studentName.trim()}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={scrollToSettings}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-stone-600/70 bg-white/5 px-3 text-xs font-semibold text-stone-300 transition hover:border-stone-500 hover:bg-white/10 hover:text-white"
                title="الانتقال لإعدادات الاختبار"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">الإعدادات</span>
              </button>

              <Button
                size="md"
                onClick={onFloatingStartClick}
                className={cn(
                  'min-h-10 px-5 text-xs font-bold shadow-md transition active:scale-95 sm:text-sm',
                  canStart
                    ? 'bg-amber-400 text-[#271b06] ring-amber-200/60 hover:bg-amber-300'
                    : 'cursor-pointer bg-stone-600 text-stone-200 ring-white/10 hover:bg-stone-500',
                )}
              >
                <Play className="h-4 w-4 shrink-0 fill-current" />
                <span>ابدأ الاختبار</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
