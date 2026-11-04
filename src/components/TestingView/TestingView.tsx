import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Layers3,
  LogOut,
  RotateCcw,
  Target,
} from 'lucide-react';
import type { TestEngine } from '../../hooks/useTestEngine';
import { formatNumber } from '../../utils/helpers';
import { formatPoints } from '../../utils/scoring';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { VerseCard } from './VerseCard';
import { EvaluationPanel } from './EvaluationPanel';

interface TestingViewProps {
  engine: TestEngine;
}

export function TestingView({ engine }: TestingViewProps) {
  const [hideText, setHideText] = useState(engine.config?.blindMode ?? false);

  const {
    currentQuestion,
    currentAyah,
    currentIndex,
    totalQuestions,
    viewedAyahs,
    summary,
    sampling,
    canGoNextAyah,
    canGoPreviousAyah,
    isAtQuestionStart,
    progressPercent,
    nextAyah,
    previousAyah,
    goToQuestionStart,
    submitEvaluation,
    finishTest,
  } = engine;

  if (!currentQuestion || !currentAyah) return null;

  const offsetFromStart = currentAyah.number - currentQuestion.startAyah.number;
  const segmentLabel =
    currentQuestion.segment.kind === 'page'
      ? `الصفحات ${formatNumber(currentQuestion.segment.from)}–${formatNumber(
          currentQuestion.segment.to,
        )}`
      : `الآيات ${formatNumber(currentQuestion.segment.from)}–${formatNumber(
          currentQuestion.segment.to,
        )}`;

  const handleEarlyFinish = () => {
    const confirmed = window.confirm(
      'هل تريد إنهاء الاختبار الآن وعرض النتائج؟ لن يُحفظ تقييم السؤال الحالي إن لم تكن قد حفظته.',
    );
    if (confirmed) finishTest();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-stone-200/80 bg-white/85 p-5 shadow-sm shadow-stone-900/[0.03] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-white">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold text-teal-700">جلسة اختبار</p>
                <h2 className="text-lg font-bold text-stone-900">
                  السؤال {formatNumber(currentIndex + 1)} من{' '}
                  {formatNumber(totalQuestions)}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              قُيّم {formatNumber(summary.ratedQuestions)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              درجات {formatPoints(summary.totalPoints)}
            </span>
            <button
              type="button"
              onClick={handleEarlyFinish}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              إنهاء مبكر
            </button>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={progressPercent} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Layers3 className="h-3 w-3" />
              شريحة السؤال: {segmentLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              {hideText ? 'وضع أعمى — النص مخفي' : 'وضع المختبر — النص ظاهر'}
            </span>
          </div>
        </div>

        {sampling?.capped ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-800">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            طلبت {formatNumber(sampling.requestedCount)} سؤالًا، وتم إنشاء{' '}
            {formatNumber(sampling.actualCount)} فقط لأن النطاق لا يحتوي على شرائح
            كافية.
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-2.5 shadow-sm shadow-stone-900/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={previousAyah}
                  disabled={!canGoPreviousAyah}
                  aria-label="الآية السابقة"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابقة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToQuestionStart}
                  disabled={isAtQuestionStart}
                  aria-label="العودة إلى بداية السؤال"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">بداية السؤال</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={nextAyah}
                  disabled={!canGoNextAyah}
                  aria-label="الآية التالية"
                >
                  التالية
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setHideText((current) => !current)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-pressed={hideText}
              >
                {hideText ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    إظهار النص
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    إخفاء النص
                  </>
                )}
              </button>
            </div>
          </div>

          <VerseCard
            ayah={currentAyah}
            isHidden={hideText}
            isQuestionStart={isAtQuestionStart}
            offsetFromStart={offsetFromStart}
            onReveal={() => setHideText(false)}
          />

          <div className="rounded-2xl border border-stone-200/70 bg-white/50 p-3.5 text-[11px] leading-6 text-stone-500">
            <p className="flex items-center gap-1.5 font-bold text-stone-700">
              <Info className="h-3.5 w-3.5 text-teal-600" />
              أثناء التسميع
            </p>
            <p className="mt-1">
              استخدم «التالية» للتحقق من تتابع الآيات، و«السابقة» للرجوع عند الحاجة.
              التنقل بين الآيات لا يغيّر السؤال الحالي؛ احفظ التقييم عند الانتهاء
              للانتقال إلى الشريحة التالية.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <EvaluationPanel
            key={currentQuestion.id}
            question={currentQuestion}
            isLastQuestion={currentIndex === totalQuestions - 1}
            viewedAyahs={viewedAyahs}
            onSubmit={submitEvaluation}
          />
        </aside>
      </div>
    </div>
  );
}
