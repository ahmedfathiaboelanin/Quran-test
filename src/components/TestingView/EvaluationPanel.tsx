import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCheck,
  Clock,
  Info,
  Minus,
  Music2,
  NotebookPen,
  Plus,
  SkipForward,
  X,
} from 'lucide-react';
import type { EvaluationDraft } from '../../hooks/useTestEngine';
import type { Question } from '../../types';
import { cn, formatNumber } from '../../utils/helpers';
import { computeEvaluationPoints, formatPoints } from '../../utils/scoring';
import { Button } from '../ui/Button';

interface EvaluationPanelProps {
  question: Question;
  isLastQuestion: boolean;
  viewedAyahs: number;
  onSubmit: (draft: EvaluationDraft, finishAfter?: boolean) => void;
}

type CounterTone = 'amber' | 'rose' | 'violet';

interface MistakeCounterProps {
  label: string;
  hint: string;
  value: number;
  tone: CounterTone;
  icon: typeof AlertCircle;
  onChange: (value: number) => void;
}

const counterToneClasses: Record<
  CounterTone,
  { icon: string; active: string; button: string; value: string }
> = {
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    active: 'border-amber-300 bg-amber-50/70',
    button: 'hover:bg-amber-100 text-amber-800',
    value: 'text-amber-700',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    active: 'border-rose-300 bg-rose-50/70',
    button: 'hover:bg-rose-100 text-rose-800',
    value: 'text-rose-700',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700',
    active: 'border-violet-300 bg-violet-50/70',
    button: 'hover:bg-violet-100 text-violet-800',
    value: 'text-violet-700',
  },
};

function MistakeCounter({
  label,
  hint,
  value,
  tone,
  icon: Icon,
  onChange,
}: MistakeCounterProps) {
  const tones = counterToneClasses[tone];

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border p-3 transition',
        value > 0 ? tones.active : 'border-stone-200 bg-white',
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', tones.icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-stone-800">{label}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-stone-500">{hint}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          aria-label={`تقليل ${label}`}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition',
            'hover:border-stone-300 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
            'disabled:cursor-not-allowed disabled:opacity-35',
          )}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          className="w-7 text-center text-sm font-bold tabular-nums text-stone-900"
          aria-live="polite"
        >
          {formatNumber(value)}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label={`زيادة ${label}`}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition',
            'hover:border-stone-300 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
            tones.button,
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface DockCounterProps {
  label: string;
  pointsLabel: string;
  value: number;
  tone: CounterTone;
  icon: typeof AlertCircle;
  onChange: (value: number) => void;
}

function DockCounter({
  label,
  pointsLabel,
  value,
  tone,
  icon: Icon,
  onChange,
}: DockCounterProps) {
  const tones = counterToneClasses[tone];

  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border px-1.5 py-1.5 transition',
        value > 0 ? tones.active : 'border-stone-200 bg-white',
      )}
    >
      <div className="flex items-center justify-center gap-1">
        <Icon className={cn('h-3 w-3 shrink-0', value > 0 ? tones.value : 'text-stone-400')} />
        <p className="truncate text-[10px] font-bold text-stone-700">{label}</p>
        <span className="shrink-0 rounded-full bg-stone-100 px-1 py-0.5 text-[8px] font-bold text-stone-500">
          {pointsLabel}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          aria-label={`تقليل ${label}`}
          className="grid h-9 w-9 touch-manipulation place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          className={cn(
            'w-5 text-center text-sm font-bold tabular-nums',
            value > 0 ? tones.value : 'text-stone-700',
          )}
          aria-live="polite"
        >
          {formatNumber(value)}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label={`زيادة ${label}`}
          className={cn(
            'grid h-9 w-9 touch-manipulation place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition active:bg-stone-100',
            tones.button,
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface NoteSheetProps {
  textareaId: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

function NoteSheet({ textareaId, value, onChange, onClose }: NoteSheetProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] lg:hidden print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${textareaId}-title`}
      dir="rtl"
    >
      <button
        type="button"
        aria-label="إغلاق ملاحظات المختبر"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-stone-950/45 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-stone-200 bg-[#fffdf7] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-teal-700">اختياري</p>
              <h3
                id={`${textareaId}-title`}
                className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-stone-900"
              >
                <NotebookPen className="h-4 w-4 text-stone-400" />
                ملاحظات المختبر
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <textarea
            id={textareaId}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            autoFocus
            placeholder="مثال: تردد عند الوصل، أو تحسين موضع الوقف..."
            className="mt-3 w-full resize-y rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base leading-6 text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />

          <Button size="lg" className="mt-3 w-full" onClick={onClose}>
            <CheckCheck className="h-4 w-4" />
            تم
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface MobileEvaluationDockProps {
  question: Question;
  isLastQuestion: boolean;
  hifzMistakes: number;
  tajweedMistakes: number;
  hesitations: number;
  note: string;
  totalPoints: number;
  onHifzChange: (value: number) => void;
  onTajweedChange: (value: number) => void;
  onHesitationsChange: (value: number) => void;
  onSave: () => void;
  onSkip: () => void;
  onOpenNote: () => void;
}

function MobileEvaluationDock({
  question,
  isLastQuestion,
  hifzMistakes,
  tajweedMistakes,
  hesitations,
  note,
  totalPoints,
  onHifzChange,
  onTajweedChange,
  onHesitationsChange,
  onSave,
  onSkip,
  onOpenNote,
}: MobileEvaluationDockProps) {
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-[#f8f5ee]/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(28,25,23,0.08)] backdrop-blur-xl lg:hidden print:hidden"
      dir="rtl"
      role="region"
      aria-label="تقييم السؤال"
    >
      <div className="mx-auto w-full max-w-lg">
        <div className="grid grid-cols-2 gap-1.5 min-[360px]:grid-cols-3">
          <DockCounter
            label="تردد"
            pointsLabel="٠٫٥"
            value={hesitations}
            tone="amber"
            icon={Clock}
            onChange={onHesitationsChange}
          />
          <DockCounter
            label="حفظ"
            pointsLabel="١"
            value={hifzMistakes}
            tone="rose"
            icon={AlertCircle}
            onChange={onHifzChange}
          />
          <DockCounter
            label="تجويد"
            pointsLabel="١"
            value={tajweedMistakes}
            tone="violet"
            icon={Music2}
            onChange={onTajweedChange}
          />
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <div
            className={cn(
              'flex h-11 min-w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-xl border px-1.5',
              totalPoints === 0
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50',
            )}
            aria-label={`درجة السؤال ${formatPoints(totalPoints)}`}
          >
            <span className="text-[8px] font-semibold leading-none text-stone-500">
              الدرجة
            </span>
            <span
              className={cn(
                'text-lg font-bold leading-tight tabular-nums',
                totalPoints === 0 ? 'text-emerald-700' : 'text-rose-700',
              )}
              aria-live="polite"
            >
              {formatPoints(totalPoints)}
            </span>
          </div>

          <Button size="md" className="min-h-11 flex-1 px-3" onClick={onSave}>
            <CheckCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isLastQuestion ? 'عرض النتائج' : 'حفظ والتالي'}
            </span>
          </Button>

          <button
            type="button"
            onClick={onOpenNote}
            aria-label="ملاحظات المختبر"
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
          >
            <NotebookPen className="h-4 w-4" />
            {note.trim() ? (
              <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-teal-600" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={onSkip}
            aria-label="تخطي هذا السؤال بدون تقييم"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-400 transition hover:bg-stone-50 hover:text-stone-700"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-center text-[9px] leading-4 text-stone-400">
          السؤال {formatNumber(question.index + 1)} • كل خطأ = درجة، والتردد = نصف
          درجة
        </p>
      </div>
    </div>,
    document.body,
  );
}

export function EvaluationPanel({
  question,
  isLastQuestion,
  viewedAyahs,
  onSubmit,
}: EvaluationPanelProps) {
  const [hifzMistakes, setHifzMistakes] = useState(0);
  const [tajweedMistakes, setTajweedMistakes] = useState(0);
  const [hesitations, setHesitations] = useState(0);
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);

  const totalPoints = computeEvaluationPoints({
    hifzMistakes,
    tajweedMistakes,
    hesitations,
  });

  const draft: EvaluationDraft = {
    hifzMistakes,
    tajweedMistakes,
    hesitations,
    note,
  };

  const closeNote = useCallback(() => setNoteOpen(false), []);

  const handleSkip = useCallback(() => {
    onSubmit(
      {
        hifzMistakes: 0,
        tajweedMistakes: 0,
        hesitations: 0,
        note: '',
        skipped: true,
      },
      false,
    );
  }, [onSubmit]);

  return (
    <>
      <section className="hidden rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-sm shadow-stone-900/[0.03] lg:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-teal-700">
              السؤال {formatNumber(question.index + 1)}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-stone-900">
              تقييم التسميع بالدرجات
            </h2>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-500">
            {formatNumber(viewedAyahs)} آية مفتوحة
          </span>
        </div>

        <div
          className={cn(
            'mt-4 rounded-2xl border p-4 text-center transition-colors',
            totalPoints === 0
              ? 'border-emerald-200 bg-emerald-50/80'
              : 'border-rose-200 bg-rose-50/80',
          )}
          aria-live="polite"
        >
          <p className="text-[11px] font-bold text-stone-600">درجة السؤال</p>
          <p
            className={cn(
              'mt-1 text-4xl font-bold tabular-nums',
              totalPoints === 0 ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {formatPoints(totalPoints)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-stone-500">
            {totalPoints === 0 ? 'بدون أخطاء' : 'مجموع الأخطاء — الأقل أفضل'}
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-800">سجّل الأخطاء</span>
            {totalPoints > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setHifzMistakes(0);
                  setTajweedMistakes(0);
                  setHesitations(0);
                }}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                تصفير
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            <MistakeCounter
              label="تردد"
              hint="نصف درجة لكل تردد"
              value={hesitations}
              tone="amber"
              icon={Clock}
              onChange={setHesitations}
            />
            <MistakeCounter
              label="خطأ حفظ"
              hint="درجة واحدة لكل خطأ واضح"
              value={hifzMistakes}
              tone="rose"
              icon={AlertCircle}
              onChange={setHifzMistakes}
            />
            <MistakeCounter
              label="خطأ تجويد"
              hint="درجة واحدة لكل خطأ واضح"
              value={tajweedMistakes}
              tone="violet"
              icon={Music2}
              onChange={setTajweedMistakes}
            />
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-teal-50/70 p-2.5 text-[10px] leading-5 text-teal-900">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          التقييم بيد المختبر: الدرجة تعبّر عن الأخطاء وليست عن الإجابات الصحيحة.
          كل خطأ واضح = درجة، وكل تردد = نصف درجة. إذا لم تسجّل أي خطأ ستكون الدرجة ٠.
        </p>

        <div className="mt-4">
          <label
            htmlFor={`question-note-${question.id}`}
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-800"
          >
            <NotebookPen className="h-3.5 w-3.5 text-stone-400" />
            ملاحظات المختبر
            <span className="text-[10px] font-normal text-stone-400">(اختياري)</span>
          </label>
          <textarea
            id={`question-note-${question.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="مثال: تردد عند الوصل، أو تحسين موضع الوقف..."
            className="w-full resize-y rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm leading-6 text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="mt-5 space-y-2">
          <Button size="lg" className="w-full" onClick={() => onSubmit(draft, false)}>
            <CheckCheck className="h-4 w-4" />
            {isLastQuestion ? 'حفظ وعرض النتائج' : 'حفظ والتالي'}
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          >
            <SkipForward className="h-3 w-3" />
            تخطي هذا السؤال بدون تقييم
          </button>
        </div>
      </section>

      <MobileEvaluationDock
        question={question}
        isLastQuestion={isLastQuestion}
        hifzMistakes={hifzMistakes}
        tajweedMistakes={tajweedMistakes}
        hesitations={hesitations}
        note={note}
        totalPoints={totalPoints}
        onHifzChange={setHifzMistakes}
        onTajweedChange={setTajweedMistakes}
        onHesitationsChange={setHesitations}
        onSave={() => onSubmit(draft, false)}
        onSkip={handleSkip}
        onOpenNote={() => setNoteOpen(true)}
      />

      {noteOpen ? (
        <NoteSheet
          textareaId={`mobile-question-note-${question.id}`}
          value={note}
          onChange={setNote}
          onClose={closeNote}
        />
      ) : null}
    </>
  );
}
