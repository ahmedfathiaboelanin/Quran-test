import { describe, expect, it } from 'vitest';
import type { AyahRef } from '../../types';
import {
  createBalancedSegments,
  generateQuestions,
} from '../samplingAlgorithm';

function makeAyah(number: number, page: number): AyahRef {
  return {
    number,
    numberInSurah: number,
    text: `آية ${number}`,
    juz: 1,
    page,
    surahNumber: 1,
    surahName: 'سورة الاختبار',
    surahEnglishName: 'Test',
    surahTranslation: 'Test',
  };
}

function makePool(count: number, pagesPerAyah = 1): AyahRef[] {
  return Array.from({ length: count }, (_, index) =>
    makeAyah(index + 1, Math.floor(index / pagesPerAyah) + 1),
  );
}

describe('createBalancedSegments', () => {
  it('creates exactly the requested number of balanced segments', () => {
    const segments = createBalancedSegments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.length)).toEqual([4, 3, 3]);
    expect(segments.flat()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('never creates empty segments', () => {
    const segments = createBalancedSegments(['a', 'b', 'c'], 10);
    expect(segments).toHaveLength(3);
    expect(segments.flat()).toEqual(['a', 'b', 'c']);
  });
});

describe('generateQuestions', () => {
  it('samples one question per page block when pages >= questions', () => {
    const pool = makePool(100, 1);
    const result = generateQuestions(pool, 10, { unit: 'auto', random: () => 0 });

    expect(result.unitUsed).toBe('page');
    expect(result.questions).toHaveLength(10);
    expect(result.capped).toBe(false);

    for (const question of result.questions) {
      expect(question.segment.kind).toBe('page');
      expect(question.startAyah.page).toBeGreaterThanOrEqual(question.segment.from);
      expect(question.startAyah.page).toBeLessThanOrEqual(question.segment.to);
      expect(question.segment.count).toBe(10);
    }
  });

  it('falls back to ayah segmentation when there are fewer pages than questions', () => {
    const pool = makePool(10, 2); // 10 ayaat on 5 pages
    const result = generateQuestions(pool, 8, { unit: 'page', random: () => 0.5 });

    expect(result.unitUsed).toBe('ayah');
    expect(result.questions).toHaveLength(8);
    expect(result.questions.every((question) => question.segment.kind === 'ayah')).toBe(
      true,
    );
  });

  it('caps the number of questions to the pool size', () => {
    const result = generateQuestions(makePool(5), 20, { random: () => 0 });
    expect(result.questions).toHaveLength(5);
    expect(result.requestedCount).toBe(20);
    expect(result.actualCount).toBe(5);
    expect(result.capped).toBe(true);
  });

  it('deduplicates repeated ayaat before distribution', () => {
    const pool = [...makePool(10), ...makePool(10)];
    const result = generateQuestions(pool, 10, { unit: 'ayah', random: () => 0 });

    expect(result.questions).toHaveLength(10);
    const ids = new Set(result.questions.map((question) => question.startAyah.number));
    expect(ids.size).toBe(10);
  });

  it('returns an empty result for an empty pool', () => {
    const result = generateQuestions([], 10);
    expect(result.questions).toEqual([]);
    expect(result.actualCount).toBe(0);
  });
});
