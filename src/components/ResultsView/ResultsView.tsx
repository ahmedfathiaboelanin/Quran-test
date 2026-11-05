import {
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Files,
  Gauge,
  NotebookPen,
  Printer,
  RefreshCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import type { QuestionEvaluation, TestConfig, TestSummary } from '../../types';
import { formatDate, formatNumber } from '../../utils/helpers';
import { formatPoints } from '../../utils/scoring';
import { formatAveragePoints } from '../../utils/testResults';
import { Button } from '../ui/Button';
import { RevisionList } from './RevisionList';

interface ResultsViewProps {
  summary: TestSummary;
  config: TestConfig | null;
  onRestartSameScope: () => void;
  onNewTest: () => void;
}

function PointsBadge({ evaluation }: { evaluation: QuestionEvaluation | null }) {
  if (!evaluation) {
    return (
      <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-500">
        لم يُقيّم
      </span>
    );
  }

  if (evaluation.points === null) {
    return (
      <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-500">
        تم التخطي
      </span>
    );
  }

  const isClean = evaluation.points === 0;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
        isClean
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
      }`}
    >
      {isClean ? 'بدون أخطاء' : `${formatPoints(evaluation.points)} درجة`}
    </span>
  );
}

function MistakeBadges({ evaluation }: { evaluation: QuestionEvaluation | null }) {
  if (!evaluation || evaluation.points === null) return null;

  const hasMistakes =
    evaluation.responseMistakes > 0 ||
    evaluation.promptMistakes > 0 ||
    evaluation.hesitations > 0;
  if (!hasMistakes) return null;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {evaluation.responseMistakes > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
          <TriangleAlert className="h-2.5 w-2.5" />
          رد خاطئ ×{formatNumber(evaluation.responseMistakes)}
        </span>
      ) : null}
      {evaluation.promptMistakes > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
          <Bell className="h-2.5 w-2.5" />
          تنبيه ×{formatNumber(evaluation.promptMistakes)}
        </span>
      ) : null}
      {evaluation.hesitations > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <Clock className="h-2.5 w-2.5" />
          تردد ×{formatNumber(evaluation.hesitations)}
        </span>
      ) : null}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'teal',
}: {
  icon: typeof Award;
  label: string;
  value: string;
  hint: string;
  tone?: 'teal' | 'amber' | 'rose' | 'stone';
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    stone: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-4 shadow-sm shadow-stone-900/[0.02]">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-stone-900">{value}</p>
      <p className="mt-0.5 text-[10px] leading-5 text-stone-400">{hint}</p>
    </div>
  );
}

function getResultMessage(summary: TestSummary): string {
  if (summary.ratedQuestions === 0) {
    return 'لم يتم تقييم أي سؤال بعد. يمكنك إعادة الاختبار وتقييم كل سؤال للحصول على تحليل كامل.';
  }
  if (summary.totalPoints === 0) {
    return 'ما شاء الله، لم تُسجَّل أي أخطاء في هذا الاختبار. حافظ على المراجعة الدورية لهذا النطاق.';
  }

  const average = summary.averagePoints ?? 0;
  if (average <= 0.5) {
    return 'الدرجات منخفضة وأخطاؤك قليلة جدًا. راجع المواضع المذكورة أدناه لتثبيت الحفظ.';
  }
  if (average <= 1) {
    return 'أداء جيد، مع بعض الأخطاء البسيطة. راجع السور المذكورة قبل الاختبار التالي.';
  }
  if (average <= 2) {
    return 'تحتاج إلى مراجعة أكثر، خاصة السور التي تجمّعت فيها الدرجات.';
  }
  return 'ننصح بإعادة مراجعة النطاق كاملًا وتثبيت المحفوظ قبل إعادة الاختبار.';
}

export function ResultsView({
  summary,
  config,
  onRestartSameScope,
  onNewTest,
}: ResultsViewProps) {
  const responsePoints = summary.responseMistakes * 1;
  const promptPoints = summary.promptMistakes * 0.5;
  const hesitationPoints = summary.hesitations * 0.25;
  const notedResults = summary.results.filter(({ evaluation }) =>
    Boolean(evaluation?.note.trim()),
  );

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-900 p-5 text-white shadow-xl shadow-teal-950/15 sm:p-7">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_10%_10%,#fef3c7_0,transparent_28%),radial-gradient(circle_at_90%_90%,#5eead4_0,transparent_30%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-white/10 p-2 ring-1 ring-white/20 sm:h-36 sm:w-36"
              role="img"
              aria-label={`إجمالي الدرجات ${formatPoints(summary.totalPoints)}`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-teal-800 text-center shadow-inner">
                <div>
                  <p className="text-4xl font-bold tabular-nums">
                    {formatPoints(summary.totalPoints)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-teal-100/80">
                    إجمالي الدرجات
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-teal-50 ring-1 ring-white/15">
                <Award className="h-3 w-3 text-amber-300" />
                نتيجة التقييم
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {summary.ratedQuestions === 0 ? 'لا يوجد تقييم بعد' : 'مجموع الأخطاء'}
              </h2>
              <p className="mt-2 max-w-lg text-xs leading-6 text-teal-50/85 sm:text-sm">
                {getResultMessage(summary)}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-teal-50/90 ring-1 ring-white/10">
                الدرجات تعبّر عن الأخطاء — الرد = درجة، التنبيه = نصف درجة، والتردد
                = ربع درجة
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-teal-100/75">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(summary.completedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {formatNumber(summary.totalQuestions)} سؤال
                </span>
                {config ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {config.distributionUnit === 'page'
                        ? 'توزيع على الصفحات'
                        : config.distributionUnit === 'ayah'
                          ? 'توزيع على الآيات'
                          : 'توزيع تلقائي'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Files className="h-3 w-3" />
                      {config.displayMode === 'page'
                        ? 'عرض الصفحة كاملة'
                        : 'عرض آية واحدة'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Shuffle className="h-3 w-3" />
                      {config.randomizeQuestionOrder
                        ? 'ترتيب عشوائي'
                        : 'ترتيب المصحف'}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            <Button
              variant="secondary"
              onClick={onRestartSameScope}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              إعادة بنفس النطاق
            </Button>
            <Button
              variant="secondary"
              onClick={onNewTest}
              className="border-white/20 bg-white text-teal-900 hover:bg-teal-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              اختبار جديد
            </Button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-teal-50 hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="الأسئلة المقيّمة"
          value={`${formatNumber(summary.ratedQuestions)} / ${formatNumber(
            summary.totalQuestions,
          )}`}
          hint={`${formatNumber(summary.unratedQuestions)} بدون تقييم`}
        />
        <StatCard
          icon={TriangleAlert}
          label="إجمالي الدرجات"
          value={formatPoints(summary.totalPoints)}
          hint="مجموع الأخطاء — الأقل أفضل"
          tone="rose"
        />
        <StatCard
          icon={Gauge}
          label="متوسط الدرجات"
          value={formatAveragePoints(summary.averagePoints)}
          hint="متوسط درجات كل سؤال مقيّم"
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="أسئلة بدون أخطاء"
          value={formatNumber(summary.cleanQuestions)}
          hint={`من أصل ${formatNumber(summary.ratedQuestions)} سؤالًا مقيّمًا`}
        />
      </div>

      {notedResults.length > 0 ? (
        <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm shadow-stone-900/[0.03] dark:from-[#451a03]/45 dark:to-[#131b19] sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-amber-700">
                للمراجعة المركزة
              </p>
              <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-stone-900">
                <NotebookPen className="h-4 w-4 text-amber-600" />
                ملاحظات المختبر
              </h2>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
              {formatNumber(notedResults.length)} ملاحظة
            </span>
          </div>

          <div className="space-y-2">
            {notedResults.map(({ question, evaluation }) => (
              <article
                key={question.id}
                className="rounded-xl border border-amber-100 bg-white/90 p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-[10px] font-bold text-amber-800">
                      {formatNumber(question.index + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-800">
                        {question.startAyah.surahName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        الآية {formatNumber(question.startAyah.numberInSurah)} • صفحة{' '}
                        {formatNumber(question.startAyah.page)} • الجزء{' '}
                        {formatNumber(question.startAyah.juz)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      <NotebookPen className="h-3 w-3" />
                      ملاحظة
                    </span>
                    <PointsBadge evaluation={evaluation} />
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-50/60 px-3 py-2 text-[12px] leading-6 text-stone-700">
                  {evaluation?.note}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-stone-200/80 bg-white/85 p-5 shadow-sm shadow-stone-900/[0.03] sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-rose-700">
              طريقة الحساب
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-stone-900">تفصيل الدرجات</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-600">
            {formatPoints(summary.totalPoints)} درجة
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <TriangleAlert className="h-3.5 w-3.5" />
              الردود الخاطئة
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-rose-900">
              {formatNumber(summary.responseMistakes)}
            </p>
            <p className="text-[10px] text-stone-500">
              {formatNumber(summary.responseMistakes)} × درجة ={' '}
              {formatPoints(responsePoints)} درجة
            </p>
          </div>

          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
              <Bell className="h-3.5 w-3.5" />
              التنبيهات
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-violet-900">
              {formatNumber(summary.promptMistakes)}
            </p>
            <p className="text-[10px] text-stone-500">
              {formatNumber(summary.promptMistakes)} × نصف درجة ={' '}
              {formatPoints(promptPoints)} درجة
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5" />
              التردد
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-amber-900">
              {formatNumber(summary.hesitations)}
            </p>
            <p className="text-[10px] text-stone-500">
              {formatNumber(summary.hesitations)} × ربع درجة ={' '}
              {formatPoints(hesitationPoints)} درجة
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/80 bg-white/85 p-5 shadow-sm shadow-stone-900/[0.03] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-amber-700">
              خطة المراجعة
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-stone-900">سور تحتاج مراجعة</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
            {formatNumber(summary.revisionSurahs.length)} سورة
          </span>
        </div>
        <RevisionList items={summary.revisionSurahs} />
      </section>

      <section className="rounded-3xl border border-stone-200/80 bg-white/85 p-5 shadow-sm shadow-stone-900/[0.03] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-teal-700">
              سجل الأسئلة
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-stone-900">تفاصيل الأسئلة</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-600">
            {formatNumber(summary.results.length)} سؤال
          </span>
        </div>

        <div className="space-y-2">
          {summary.results.map(({ question, evaluation }) => (
            <article
              key={question.id}
              className="rounded-xl border border-stone-200 bg-white p-3.5 transition hover:border-stone-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">
                    {formatNumber(question.index + 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-800">
                      {question.startAyah.surahName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-500">
                      الآية {formatNumber(question.startAyah.numberInSurah)} • صفحة{' '}
                      {formatNumber(question.startAyah.page)} • الجزء{' '}
                      {formatNumber(question.startAyah.juz)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-500">
                    {evaluation
                      ? `${formatNumber(evaluation.reviewedAyahs)} آية`
                      : 'لم يُقيّم'}
                  </span>
                  <PointsBadge evaluation={evaluation} />
                  <MistakeBadges evaluation={evaluation} />
                </div>
              </div>

              {evaluation?.note ? (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 px-3 py-2 text-[11px] leading-6 text-stone-600">
                  <span className="font-semibold text-stone-700">ملاحظة: </span>
                  {evaluation.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-2 pb-4 print:hidden">
        <Button onClick={onRestartSameScope}>
          <RefreshCcw className="h-4 w-4" />
          إعادة بنفس النطاق
        </Button>
        <Button variant="secondary" onClick={onNewTest}>
          <SlidersHorizontal className="h-4 w-4" />
          العودة إلى الإعدادات
        </Button>
      </div>
    </div>
  );
}
