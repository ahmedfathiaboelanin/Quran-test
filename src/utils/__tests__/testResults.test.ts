import { describe, expect, it } from 'vitest';
import type { AyahRef, Question, QuestionEvaluation } from '../../types';
import { computeEvaluationPoints } from '../scoring';
import { computeTestSummary } from '../testResults';

function makeQuestion(id: string, index: number, surahNumber: number, surahName: string): Question {
  const startAyah: AyahRef = {
    number: index + 1,
    numberInSurah: 1,
    text: 'آية',
    juz: 1,
    page: index + 1,
    surahNumber,
    surahName,
    surahEnglishName: 'Test',
    surahTranslation: 'Test',
  };

  return {
    id,
    index,
    startAyah,
    segment: { kind: 'ayah', index, from: index + 1, to: index + 1, count: 1 },
  };
}

function makeEvaluation(
  questionId: string,
  points: number | null,
  counts: { response?: number; prompt?: number; hesitations?: number } = {},
): QuestionEvaluation {
  return {
    questionId,
    points,
    responseMistakes: counts.response ?? 0,
    promptMistakes: counts.prompt ?? 0,
    hesitations: counts.hesitations ?? 0,
    note: '',
    reviewedAyahs: 1,
    completedAt: '2026-01-01T10:00:00.000Z',
  };
}

describe('computeEvaluationPoints', () => {
  it('charges one point per incorrect response, half per prompt and a quarter per hesitation', () => {
    expect(
      computeEvaluationPoints({
        responseMistakes: 2,
        promptMistakes: 1,
        hesitations: 3,
      }),
    ).toBe(3.25);
    expect(
      computeEvaluationPoints({
        responseMistakes: 0,
        promptMistakes: 0,
        hesitations: 0,
      }),
    ).toBe(0);
  });
});

describe('computeTestSummary', () => {
  const questions = [
    makeQuestion('q1', 0, 50, 'ق'),
    makeQuestion('q2', 1, 50, 'ق'),
    makeQuestion('q3', 2, 51, 'الذاريات'),
  ];

  it('sums deduction points and separates clean, skipped and unrated questions', () => {
    const summary = computeTestSummary(questions, {
      q1: makeEvaluation('q1', 1, { response: 1 }),
      q2: makeEvaluation('q2', 0),
      q3: makeEvaluation('q3', 0.25, { hesitations: 1 }),
    });

    expect(summary.totalPoints).toBe(1.25);
    expect(summary.averagePoints).toBe(0.42);
    expect(summary.cleanQuestions).toBe(1);
    expect(summary.ratedQuestions).toBe(3);
    expect(summary.unratedQuestions).toBe(0);
    expect(summary.responseMistakes).toBe(1);
    expect(summary.promptMistakes).toBe(0);
    expect(summary.hesitations).toBe(1);
    expect(summary.totalMistakes).toBe(1);
  });

  it('excludes skipped questions from points but keeps them as reviewed', () => {
    const summary = computeTestSummary(questions, {
      q1: makeEvaluation('q1', 1, { response: 1 }),
      q2: makeEvaluation('q2', null),
    });

    expect(summary.reviewedQuestions).toBe(2);
    expect(summary.ratedQuestions).toBe(1);
    expect(summary.unratedQuestions).toBe(2);
    expect(summary.totalPoints).toBe(1);
    expect(summary.averagePoints).toBe(1);
  });

  it('builds a revision plan sorted by accumulated points', () => {
    const summary = computeTestSummary(questions, {
      q1: makeEvaluation('q1', 1, { response: 1 }),
      q2: makeEvaluation('q2', 0),
      q3: makeEvaluation('q3', 0.25, { hesitations: 1 }),
    });

    expect(summary.revisionSurahs).toHaveLength(2);
    expect(summary.revisionSurahs[0]).toMatchObject({
      surahNumber: 50,
      points: 1,
      responseMistakes: 1,
      promptMistakes: 0,
      hesitations: 0,
      questions: 1,
    });
    expect(summary.revisionSurahs[1]).toMatchObject({
      surahNumber: 51,
      points: 0.25,
      responseMistakes: 0,
      promptMistakes: 0,
      hesitations: 1,
      questions: 1,
    });
  });

  it('accumulates prompts separately from incorrect responses', () => {
    const summary = computeTestSummary(questions, {
      q1: makeEvaluation('q1', 0.5, { prompt: 1 }),
      q2: makeEvaluation('q2', 0.5, { prompt: 1 }),
    });

    expect(summary.totalPoints).toBe(1);
    expect(summary.promptMistakes).toBe(2);
    expect(summary.responseMistakes).toBe(0);
    expect(summary.totalMistakes).toBe(2);
    expect(summary.revisionSurahs[0]).toMatchObject({
      surahNumber: 50,
      promptMistakes: 2,
      questions: 2,
    });
  });

  it('leaves average points empty when nothing was evaluated', () => {
    const summary = computeTestSummary(questions, {});
    expect(summary.totalPoints).toBe(0);
    expect(summary.averagePoints).toBeNull();
    expect(summary.ratedQuestions).toBe(0);
    expect(summary.revisionSurahs).toHaveLength(0);
  });
});
