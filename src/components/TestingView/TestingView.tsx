import { useEffect, useState } from 'react';
import { Eye, EyeOff, Info, Keyboard, ListChecks, LogOut } from 'lucide-react';
import type { TestEngine } from '../../hooks/useTestEngine';
import type { QuestionDisplayMode } from '../../types';
import { getPageAyahs, getPageFirstAyah } from '../../utils/quranHelpers';
import { cn, formatNumber } from '../../utils/helpers';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProgressBar } from '../ui/ProgressBar';
import { ShortcutsDialog } from '../ui/ShortcutsDialog';
import { VerseCard } from './VerseCard';
import { EvaluationPanel } from './EvaluationPanel';

interface TestingViewProps {
  engine: TestEngine;
}

export function TestingView({ engine }: TestingViewProps) {
  const [hideText, setHideText] = useState(engine.config?.blindMode ?? false);
  const [displayMode, setDisplayMode] = useState<QuestionDisplayMode>(
    () => engine.config?.displayMode ?? 'ayah',
  );
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const currentQuestionId = engine.currentQuestion?.id;
  const blindMode = engine.config?.blindMode ?? false;

  // A new question starts hidden again in blind mode, so the mode keeps its purpose.
  useEffect(() => {
    setHideText(blindMode);
  }, [currentQuestionId, blindMode]);

  // Bring the new question into view on small screens and after advancing.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionId]);

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

  const pageMode = displayMode === 'page';
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

  const handleToggleDisplayMode = () => {
    setDisplayMode((curr) => (curr === 'page' ? 'ayah' : 'page'));
  };

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
  const remainingQuestions = Math.max(0, totalQuestions - currentIndex - 1);

  const handleEarlyFinish = () => {
    setFinishOpen(true);
  };

  // اختصارات لوحة المفاتيح للتنقل
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shortcutsOpen || finishOpen) return;

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
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleToggleDisplayMode();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToQuestionStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canGoNext,
    canGoPrevious,
    finishOpen,
    goToQuestionStart,
    handleNext,
    handlePrevious,
    shortcutsOpen,
  ]);

  return (
    <div
      className="space-y-4 pb-[calc(17rem+env(safe-area-inset-bottom))] sm:space-y-5 sm:pb-[calc(13rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <section
        className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/85 px-3.5 py-3 shadow-sm shadow-stone-900/[0.03] backdrop-blur sm:px-4"
        aria-label="حالة الاختبار"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-white shadow-sm shadow-teal-900/20">
          <ListChecks className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p
              className="truncate text-xs font-bold text-stone-900 sm:text-sm"
              aria-live="polite"
            >
              السؤال {formatNumber(currentIndex + 1)} من{' '}
              {formatNumber(totalQuestions)}
            </p>
            <span className="hidden shrink-0 text-[10px] font-semibold text-stone-500 sm:inline">
              {remainingQuestions > 0
                ? `متبقي ${formatNumber(remainingQuestions)} سؤال`
                : 'السؤال الأخير'}
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            className="mt-1.5 h-2"
            label="تقدم الاختبار"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHideText((current) => !current)}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
              hideText
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'border-stone-200 bg-white text-stone-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300',
            )}
            aria-label={hideText ? 'إظهار النص' : 'إخفاء النص'}
            title={hideText ? 'إظهار النص [H]' : 'إخفاء النص [H]'}
          >
            {hideText ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <span className="hidden text-[10px] font-bold sm:inline">
              {hideText ? 'إظهار النص' : 'إخفاء النص'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            aria-label="عرض اختصارات لوحة المفاتيح"
            title="اختصارات لوحة المفاتيح [؟]"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleEarlyFinish}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            aria-label="إنهاء مبكر"
            title="إنهاء الاختبار مبكرًا وعرض النتائج"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden text-[10px] font-bold sm:inline">إنهاء مبكر</span>
          </button>
        </div>
      </section>

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
            onToggleDisplayMode={handleToggleDisplayMode}
          />

          <div className="hidden rounded-2xl border border-stone-200/70 bg-white/50 p-3.5 text-[11px] leading-6 text-stone-500 sm:block">
            <p className="flex items-center gap-1.5 font-bold text-stone-700">
              <Info className="h-3.5 w-3.5 text-teal-600" />
              أثناء التسميع
            </p>
            <p className="mt-1">
              {pageMode
                ? 'وضع عرض الصفحة كاملة: استخدم «الصفحة التالية» و«الصفحة السابقة» للتنقل بين الصفحات. يمكنك التبديل لعرض آية واحدة بالزر أعلاه أو الضغط على مفتاح [P].'
                : 'وضع عرض الآية: استخدم «التالية» و«السابقة» للتحقق من تتابع الآيات. يمكنك التبديل لعرض صفحة كاملة بالزر أعلاه أو الضغط على مفتاح [P].'}
              {' '}وللاطلاع على كل الاختصارات اضغط زر لوحة المفاتيح بالأعلى أو مفتاح [؟].
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
              currentPage: currentAyah.page,
              progressPercent,
              canGoPrevious,
              canGoNext,
              onPrevious: handlePrevious,
              onNext: handleNext,
              onGoToStart: goToQuestionStart,
              isAtStart: isAtQuestionStart,
              onToggleHideText: () => setHideText((c) => !c),
              isTextHidden: hideText,
              onToggleDisplayMode: handleToggleDisplayMode,
              isPageMode: pageMode,
            }}
          />
        </aside>
      </div>

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <ConfirmDialog
        open={finishOpen}
        title="إنهاء الاختبار الآن؟"
        description="سيتم عرض النتائج فورًا. لن يُحفظ تقييم السؤال الحالي إن لم تكن قد حفظته، ويمكنك بعد ذلك بدء اختبار جديد أو إعادة الاختبار بنفس النطاق."
        confirmLabel="إنهاء وعرض النتائج"
        cancelLabel="متابعة الاختبار"
        tone="warning"
        icon={ListChecks}
        onConfirm={finishTest}
        onClose={() => setFinishOpen(false)}
      />
    </div>
  );
}
