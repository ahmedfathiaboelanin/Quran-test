import { WEEK_SLOTS } from '../types/monthlySheet';
import type {
  MonthlyScoreFields,
  SheetSlot,
} from '../types/monthlySheet';

type ScoreInput = Partial<MonthlyScoreFields>;

function recordedWeekValues(record: ScoreInput): number[] {
  return WEEK_SLOTS.map((slot) => record[slot]).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
}

/**
 * Monthly total rule:
 *   sum(recorded weeks) - highest(recorded weeks) + monthly_exam
 *
 * The highest weekly mistake count (the worst week) is dropped. If no week has
 * been recorded, the weekly contribution is zero. A missing monthly exam is
 * treated as zero.
 */
export function calculateTotalMistakes(record: ScoreInput): number {
  const weeks = recordedWeekValues(record);
  const weeklySum = weeks.reduce((sum, value) => sum + value, 0);
  const droppedWeek = weeks.length > 0 ? Math.max(...weeks) : 0;
  const monthlyExam = record.monthly_exam ?? 0;

  // Scores may be fractional; avoid floating-point artefacts in the total.
  return Math.round((weeklySum - droppedWeek + monthlyExam) * 100) / 100;
}

/**
 * Automatic monthly amount (reward/penalty) derived from the total mistakes:
 *   0         → +500
 *   0 < n ≤ 1 → +200
 *   1 < n < 3 → 0
 *   3 ≤ n < 4 → -100
 *   4 ≤ n < 5 → -150
 *   5 ≤ n < 6 → -250
 *   n ≥ 6     → -(n × 100)
 *
 * Totals may be fractional. The stated upper bounds (3.75, 4.75, 5.75) extend
 * to the next whole threshold so values such as 3.8 or 4.9 still receive an
 * amount instead of falling into an undefined gap.
 */
export function calculateMonthlyAmount(totalMistakes: number): number {
  const total = Number.isFinite(totalMistakes)
    ? Math.max(0, totalMistakes)
    : 0;

  if (total === 0) return 500;
  if (total <= 1) return 200;
  if (total < 3) return 0;
  if (total < 4) return -100;
  if (total < 5) return -150;
  if (total < 6) return -250;

  return -Math.round(total * 100 * 100) / 100;
}

/** Returns the weekly score that the rule drops, or null when no week is recorded. */
export function getDroppedWeek(record: ScoreInput): number | null {
  const weeks = recordedWeekValues(record);
  return weeks.length > 0 ? Math.max(...weeks) : null;
}

/** Slots that currently contain a recorded score. */
export function getRecordedSlots(record: ScoreInput): SheetSlot[] {
  return WEEK_SLOTS.filter((slot) => {
    const value = record[slot];
    return typeof value === 'number' && Number.isFinite(value);
  });
}
