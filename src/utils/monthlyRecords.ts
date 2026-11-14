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

  return weeklySum - droppedWeek + monthlyExam;
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
