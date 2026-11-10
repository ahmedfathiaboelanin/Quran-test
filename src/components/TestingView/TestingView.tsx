import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Keyboard,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import type { TestEngine } from '../../hooks/useTestEngine';
import { formatNumber } from '../../utils/helpers';
import { getPageAyahs, getPageFirstAyah } from '../../utils/quranHelpers';
import { Button } from '../ui/Button';
import { VerseCard } from './VerseCard';
import { EvaluationPanel } from './EvaluationPanel';

interface TestingViewProps {
  engine: TestEngine;
}

export function TestingView({ engine }: TestingViewProps) {
  const [hideText, setHideText] = useState(engine.config?.blindMode ?? false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const {
    currentQuestion,
    currentAyah,
    currentIndex,
    totalQuestions,
    viewedAyahs,
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

  const handleEarlyFinish = () => {
    const confirmed = window.confirm(
      'هل تريد إنهاء الاختبار الآن وعرض النتائج؟ لن يُحفظ تقييم السؤال الحالي إن لم تكن قد حفظته.',
    );
    if (confirmed) finishTest();
  };

  // اختصارات لوحة المفاتيح للتنقل
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoPrevious) handlePrevious();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoNext) handleNext();
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setHideText((c) => !c);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToQuestionStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, goToQuestionStart, handleNext, handlePrevious]);

  return (
    <div
      className="space-y-4 pb-[calc(17rem+env(safe-area-inset-bottom))] sm:space-y-5 sm:pb-[calc(13rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <VerseCard
            ayah={currentAyah}
            pageAyahs={pageMode ? pageAyahs : undefined}
            questionStartAyahNumber={currentQuestion.startAyah.number}
            isHidden={hideText}
            isQuestionStart={pageMode ? pageContainsQuestionStart : isAtQuestionStart}
            offsetFromStart={offsetFromStart}
            onReveal={() => setHideText(false)}
          />

          <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-white/85 p-3 shadow-sm shadow-stone-900/[0.02] sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                aria-label={pageMode ? 'الصفحة السابقة' : 'الآية السابقة'}
                className="min-h-10 px-3"
              >
                <ChevronRight className="h-4 w-4 shrink-0" />
                <span>{pageMode ? 'الصفحة السابقة' : 'السابقة'}</span>
              </Button>

              <div className="text-center">
                <span className="text-xs font-bold text-stone-800">
                  السؤال {formatNumber(currentIndex + 1)} من{' '}
                  {formatNumber(totalQuestions)}
                </span>
                {pageMode ? (
                  <span className="ms-2 text-xs font-semibold text-teal-700">
                    (صفحة {formatNumber(currentAyah.page)})
                  </span>
                ) : null}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label={pageMode ? 'الصفحة التالية' : 'الآية التالية'}
                className="min-h-10 px-3"
              >
                <span>{pageMode ? 'الصفحة التالية' : 'التالية'}</span>
                <ChevronLeft className="h-4 w-4 shrink-0" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToQuestionStart}
                  disabled={isAtQuestionStart}
                  aria-label="العودة إلى بداية السؤال"
                  className="min-h-9 px-2.5 text-xs text-stone-600 hover:bg-stone-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>بداية السؤال</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setHideText((current) => !current)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-pressed={hideText}
                  aria-label={hideText ? 'إظهار النص' : 'إخفاء النص'}
                >
                  {hideText ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>إظهار النص</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>إخفاء النص</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyboardHelp((c) => !c)}
                  className="hidden sm:inline-flex min-h-9 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition"
                  title="عرض اختصارات لوحة المفاتيح"
                  aria-label="عرض اختصارات لوحة المفاتيح"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span className="text-[11px]">اختصارات</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleEarlyFinish}
                aria-label="خروج من الاختبار"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>خروج</span>
              </button>
            </div>

            {/* شريط معلومات الاختصارات عند تفعيله */}
            {showKeyboardHelp ? (
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-2.5 text-xs text-teal-900 animate-in fade-in">
                <p className="font-bold mb-1 flex items-center gap-1">
                  <Keyboard className="h-3.5 w-3.5 text-teal-700" />
                  اختصارات لوحة المفاتيح السريعة:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">←</kbd> الآية التالية</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">→</kbd> الآية السابقة</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">1</kbd> +١ رد خاطئ</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">2</kbd> +٠٫٥ تنبيه</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">3</kbd> +٠٫٢٥ تردد</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">Enter</kbd> حفظ والتالي</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">H</kbd> إظهار/إخفاء</span>
                  <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">Home</kbd> بداية السؤال</span>
                </div>
              </div>
            ) : null}
          </div>

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
            totalQuestions={totalQuestions}
            studentName={engine.config?.studentName}
            onEarlyFinish={handleEarlyFinish}
            onSubmit={submitEvaluation}
            mobilePageNavigation={{
              currentIndex,
              totalQuestions,
              currentPage: pageMode ? currentAyah.page : undefined,
              progressPercent,
              canGoPrevious,
              canGoNext,
              onPrevious: handlePrevious,
              onNext: handleNext,
            }}
          />
        </aside>
      </div>
    </div>
  );
}
