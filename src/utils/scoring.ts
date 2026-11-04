import { formatNumber } from './helpers';

/** Each hesitation costs half a point. */
export const HESITATION_POINTS = 0.5;
/** Each clear mistake (memorization or tajweed) costs one point. */
export const CLEAR_MISTAKE_POINTS = 1;

export interface MistakeCounts {
  hifzMistakes: number;
  tajweedMistakes: number;
  hesitations: number;
}

export function computeEvaluationPoints(counts: MistakeCounts): number {
  const total =
    counts.hifzMistakes * CLEAR_MISTAKE_POINTS +
    counts.tajweedMistakes * CLEAR_MISTAKE_POINTS +
    counts.hesitations * HESITATION_POINTS;
  return Math.round(total * 10) / 10;
}

/** Formats deduction points using Arabic digits, e.g. 1.5 → ١٫٥. */
export function formatPoints(points: number): string {
  return formatNumber(Math.round(points * 10) / 10);
}
