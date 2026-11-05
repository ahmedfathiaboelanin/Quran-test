import type {
  Question,
  QuestionEvaluation,
  SurahRevisionItem,
  TestSummary,
} from '../types';
import { formatPoints } from './scoring';

/**
 * Builds the result summary around deduction points: an incorrect response
 * costs one point, a prompt costs half a point, and a hesitation costs a
 * quarter point. Lower totals are better.
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
    Math.round(rated.reduce((sum, evaluation) => sum + evaluation.points, 0) * 100) /
    100;
  const averagePoints =
    rated.length > 0
      ? Math.round((totalPoints / rated.length) * 100) / 100
      : null;
  const cleanQuestions = rated.filter((evaluation) => evaluation.points === 0).length;

  const responseMistakes = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.responseMistakes,
    0,
  );
  const promptMistakes = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.promptMistakes,
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
      responseMistakes: number;
      promptMistakes: number;
      hesitations: number;
    }
  >();

  for (const { question, evaluation } of results) {
    if (!evaluation || evaluation.points === null || evaluation.points === 0) continue;

    const existing = revisionMap.get(question.startAyah.surahNumber) ?? {
      surahName: question.startAyah.surahName,
      questions: 0,
      points: 0,
      responseMistakes: 0,
      promptMistakes: 0,
      hesitations: 0,
    };

    existing.questions += 1;
    existing.points = Math.round((existing.points + evaluation.points) * 100) / 100;
    existing.responseMistakes += evaluation.responseMistakes;
    existing.promptMistakes += evaluation.promptMistakes;
    existing.hesitations += evaluation.hesitations;
    revisionMap.set(question.startAyah.surahNumber, existing);
  }

  const revisionSurahs: SurahRevisionItem[] = [...revisionMap.entries()]
    .map(([surahNumber, item]) => ({
      surahNumber,
      surahName: item.surahName,
      questions: item.questions,
      points: item.points,
      responseMistakes: item.responseMistakes,
      promptMistakes: item.promptMistakes,
      hesitations: item.hesitations,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.responseMistakes + b.promptMistakes -
          (a.responseMistakes + a.promptMistakes) ||
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
    totalMistakes: responseMistakes + promptMistakes,
    responseMistakes,
    promptMistakes,
    hesitations,
    revisionSurahs,
    results,
    completedAt,
  };
}

export function formatAveragePoints(average: number | null): string {
  return average === null ? '—' : `${formatPoints(average)} درجة`;
}
