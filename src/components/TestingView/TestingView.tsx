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
import { getPageAyahs, getPageFirstAyah } from '../../utils/quranHelpers';
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
    goToAyah,
    goToQuestionStart,
    submitEvaluation,
    finishTest,
  } = engine;

  if (!currentQuestion || !currentAyah) return null;

  const pageMode = engine.config?.displayMode === 'page';
  const pageAyahs = pageMode ? getPageAyahs(currentAyah.page) : [currentAyah];
  const previousPageAyah = pageMode
    ? getPageFirstAyah(currentAyah.page - 1)
    : undefined;
  const nextPageAyah = pageMode ? getPageFirstAyah(currentAyah.page + 1) : undefined;
  const canGoPrevious = pageMode ? Boolean(previousPageAyah) : canGoPreviousAyah;
  const canGoNext = pageMode ? Boolean(nextPageAyah) : canGoNextAyah;
  const pageContainsQuestionStart = pageAyahs.some(
    (ayah) => ayah.number === currentQuestion.startAyah.number,
  );

  const handlePrevious = () => {
    if (pageMode) {
      if (previousPageAyah) goToAyah(previousPageAyah.number);
      return;
    }
    previousAyah();
  };

  const handleNext = () => {
    if (pageMode) {
      if (nextPageAyah) goToAyah(nextPageAyah.number);
      return;
    }
    nextAyah();
  };

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
    <div
      className={`space-y-4 ${
        pageMode
          ? 'pb-[calc(17rem+env(safe-area-inset-bottom))] sm:pb-[calc(12rem+env(safe-area-inset-bottom))]'
          : 'pb-[calc(10rem+env(safe-area-inset-bottom))]'
      } sm:space-y-5 lg:pb-0`}
    >
      <section className="rounded-2xl border border-stone-200/80 bg-white/85 p-3.5 shadow-sm shadow-stone-900/[0.03] sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-700 text-white sm:h-9 sm:w-9">
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-bold text-teal-700 sm:block">
                جلسة اختبار
              </p>
              <h2 className="truncate text-base font-bold text-stone-900 sm:text-lg">
                السؤال {formatNumber(currentIndex + 1)} من{' '}
                {formatNumber(totalQuestions)}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 sm:inline-flex">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              قُيّم {formatNumber(summary.ratedQuestions)}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 sm:inline-flex">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              درجات {formatPoints(summary.totalPoints)}
            </span>
            <button
              type="button"
              onClick={handleEarlyFinish}
              aria-label="إنهاء مبكر"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-700 sm:px-2.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">إنهاء مبكر</span>
            </button>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <ProgressBar value={progressPercent} />
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-stone-500 sm:mt-2 sm:text-[11px]">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Layers3 className="h-3 w-3 shrink-0" />
              <span className="truncate">شريحة السؤال: {segmentLabel}</span>
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
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

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-2 shadow-sm shadow-stone-900/[0.02] sm:p-2.5">
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                aria-label={pageMode ? 'الصفحة السابقة' : 'الآية السابقة'}
                className="min-h-10 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
              >
                <ChevronRight className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {pageMode ? (
                    <>
                      <span className="sm:hidden">السابقة</span>
                      <span className="hidden sm:inline">الصفحة السابقة</span>
                    </>
                  ) : (
                    'السابقة'
                  )}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToQuestionStart}
                disabled={isAtQuestionStart}
                aria-label="العودة إلى بداية السؤال"
                className="min-h-10 shrink-0 px-2 sm:px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">بداية السؤال</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label={pageMode ? 'الصفحة التالية' : 'الآية التالية'}
                className="min-h-10 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
              >
                <span className="truncate">
                  {pageMode ? (
                    <>
                      <span className="sm:hidden">التالية</span>
                      <span className="hidden sm:inline">الصفحة التالية</span>
                    </>
                  ) : (
                    'التالية'
                  )}
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0" />
              </Button>

              <button
                type="button"
                onClick={() => setHideText((current) => !current)}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:ms-auto sm:px-2.5"
                aria-pressed={hideText}
                aria-label={hideText ? 'إظهار النص' : 'إخفاء النص'}
              >
                {hideText ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">إظهار النص</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="hidden sm:inline">إخفاء النص</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <VerseCard
            ayah={currentAyah}
            pageAyahs={pageMode ? pageAyahs : undefined}
            questionStartAyahNumber={currentQuestion.startAyah.number}
            isHidden={hideText}
            isQuestionStart={pageMode ? pageContainsQuestionStart : isAtQuestionStart}
            offsetFromStart={offsetFromStart}
            onReveal={() => setHideText(false)}
          />

          <div className="hidden rounded-2xl border border-stone-200/70 bg-white/50 p-3.5 text-[11px] leading-6 text-stone-500 sm:block">
            <p className="flex items-center gap-1.5 font-bold text-stone-700">
              <Info className="h-3.5 w-3.5 text-teal-600" />
              أثناء التسميع
            </p>
            <p className="mt-1">
              {pageMode
                ? 'استخدم «الصفحة التالية» و«الصفحة السابقة» للتنقل بين صفحات المصحف. التنقل لا يغيّر السؤال الحالي؛ احفظ التقييم عند الانتهاء للانتقال إلى الشريحة التالية.'
                : 'استخدم «التالية» للتحقق من تتابع الآيات، و«السابقة» للرجوع عند الحاجة. التنقل بين الآيات لا يغيّر السؤال الحالي؛ احفظ التقييم عند الانتهاء للانتقال إلى الشريحة التالية.'}
            </p>
          </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <EvaluationPanel
            key={currentQuestion.id}
            question={currentQuestion}
            isLastQuestion={currentIndex === totalQuestions - 1}
            viewedAyahs={viewedAyahs}
            onSubmit={submitEvaluation}
            mobilePageNavigation={
              pageMode
                ? {
                    currentIndex,
                    totalQuestions,
                    currentPage: currentAyah.page,
                    progressPercent,
                    canGoPrevious,
                    canGoNext,
                    onPrevious: handlePrevious,
                    onNext: handleNext,
                  }
                : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
