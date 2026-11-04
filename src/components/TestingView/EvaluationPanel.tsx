import { useState } from 'react';
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
  { icon: string; active: string; button: string }
> = {
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    active: 'border-amber-300 bg-amber-50/70',
    button: 'hover:bg-amber-100 text-amber-800',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    active: 'border-rose-300 bg-rose-50/70',
    button: 'hover:bg-rose-100 text-rose-800',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700',
    active: 'border-violet-300 bg-violet-50/70',
    button: 'hover:bg-violet-100 text-violet-800',
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

  return (
    <section className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-sm shadow-stone-900/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-teal-700">
            السؤال {formatNumber(question.index + 1)}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-stone-900">تقييم التسميع بالدرجات</h2>
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
          onClick={() =>
            onSubmit(
              {
                hifzMistakes: 0,
                tajweedMistakes: 0,
                hesitations: 0,
                note: '',
                skipped: true,
              },
              false,
            )
          }
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-stone-400 hover:bg-stone-50 hover:text-stone-600"
        >
          <SkipForward className="h-3 w-3" />
          تخطي هذا السؤال بدون تقييم
        </button>
      </div>
    </section>
  );
}
