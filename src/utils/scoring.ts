import { formatNumber } from './helpers';

/** Each hesitation costs a quarter of a point. */
export const HESITATION_POINTS = 0.25;
/** Each incorrect response costs one point. */
export const RESPONSE_MISTAKE_POINTS = 1;
/** Each prompt from the examiner costs half a point. */
export const PROMPT_POINTS = 0.5;

export interface MistakeCounts {
  responseMistakes: number;
  promptMistakes: number;
  hesitations: number;
}

export function computeEvaluationPoints(counts: MistakeCounts): number {
  const total =
    counts.responseMistakes * RESPONSE_MISTAKE_POINTS +
    counts.promptMistakes * PROMPT_POINTS +
    counts.hesitations * HESITATION_POINTS;
  return Math.round(total * 100) / 100;
}

/** Formats deduction points using Arabic digits, e.g. 0.25 → ٠٫٢٥. */
export function formatPoints(points: number): string {
  return formatNumber(Math.round(points * 100) / 100);
}
