import type {
  Question,
  QuestionEvaluation,
  SurahRevisionItem,
  TestSummary,
} from '../types';
import { formatPoints } from './scoring';

/**
 * Builds the result summary around deduction points: every clear mistake costs
 * one point and every hesitation costs half a point. Lower totals are better.
 */
export function computeTestSummary(
  questions: Question[],
  evaluationMap: Record<string, QuestionEvaluation>,
): TestSummary {
  const results = questions.map((question) => ({
    question,
    evaluation: evaluationMap[question.id] ?? null,
  }));

  const evaluations = results
    .map((result) => result.evaluation)
    .filter((evaluation): evaluation is QuestionEvaluation => evaluation !== null);

  const rated = evaluations.filter(
    (evaluation): evaluation is QuestionEvaluation & { points: number } =>
      evaluation.points !== null,
  );

  const totalPoints =
    Math.round(rated.reduce((sum, evaluation) => sum + evaluation.points, 0) * 10) /
    10;
  const averagePoints =
    rated.length > 0 ? Math.round((totalPoints / rated.length) * 10) / 10 : null;
  const cleanQuestions = rated.filter((evaluation) => evaluation.points === 0).length;

  const hifzMistakes = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.hifzMistakes,
    0,
  );
  const tajweedMistakes = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.tajweedMistakes,
    0,
  );
  const hesitations = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.hesitations,
    0,
  );

  const revisionMap = new Map<
    number,
    {
      surahName: string;
      questions: number;
      points: number;
      mistakes: number;
      hesitations: number;
    }
  >();

  for (const { question, evaluation } of results) {
    if (!evaluation || evaluation.points === null || evaluation.points === 0) continue;

    const existing = revisionMap.get(question.startAyah.surahNumber) ?? {
      surahName: question.startAyah.surahName,
      questions: 0,
      points: 0,
      mistakes: 0,
      hesitations: 0,
    };

    existing.questions += 1;
    existing.points = Math.round((existing.points + evaluation.points) * 10) / 10;
    existing.mistakes += evaluation.hifzMistakes + evaluation.tajweedMistakes;
    existing.hesitations += evaluation.hesitations;
    revisionMap.set(question.startAyah.surahNumber, existing);
  }

  const revisionSurahs: SurahRevisionItem[] = [...revisionMap.entries()]
    .map(([surahNumber, item]) => ({
      surahNumber,
      surahName: item.surahName,
      questions: item.questions,
      points: item.points,
      mistakes: item.mistakes,
      hesitations: item.hesitations,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.mistakes - a.mistakes ||
        b.questions - a.questions,
    );

  const completedAt =
    evaluations.length > 0
      ? evaluations
          .map((evaluation) => evaluation.completedAt)
          .sort()
          .at(-1) ?? null
      : null;

  return {
    totalQuestions: questions.length,
    reviewedQuestions: evaluations.length,
    ratedQuestions: rated.length,
    unratedQuestions: Math.max(0, questions.length - rated.length),
    totalPoints,
    averagePoints,
    cleanQuestions,
    totalMistakes: hifzMistakes + tajweedMistakes,
    hifzMistakes,
    tajweedMistakes,
    hesitations,
    revisionSurahs,
    results,
    completedAt,
  };
}

export function formatAveragePoints(average: number | null): string {
  return average === null ? '—' : `${formatPoints(average)} درجة`;
}
