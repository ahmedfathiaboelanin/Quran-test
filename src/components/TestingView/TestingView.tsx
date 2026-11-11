import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import type { TestEngine } from '../../hooks/useTestEngine';
import { getPageAyahs, getPageFirstAyah } from '../../utils/quranHelpers';
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
              onGoToStart: goToQuestionStart,
              isAtStart: isAtQuestionStart,
              onToggleHideText: () => setHideText((c) => !c),
              isTextHidden: hideText,
            }}
          />
        </aside>
      </div>
    </div>
  );
}
