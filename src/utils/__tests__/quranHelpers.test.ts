import { describe, expect, it } from 'vitest';
import {
  ALL_AYAHS,
  AYAHS_BY_SURAH,
  SURAHS,
  TOTAL_AYAHS,
  TOTAL_JUZ,
  TOTAL_PAGES,
} from '../../data/quranData';
import {
  getJuzSummaries,
  getScopeStats,
  isScopeEmpty,
  resolveScope,
} from '../quranHelpers';

describe('bundled Quran data', () => {
  it('contains the full mushaf', () => {
    expect(SURAHS).toHaveLength(114);
    expect(TOTAL_AYAHS).toBe(6236);
    expect(TOTAL_PAGES).toBe(604);
    expect(TOTAL_JUZ).toBe(30);
  });

  it('keeps ayahs in continuous global order without duplicates', () => {
    ALL_AYAHS.forEach((ayah, index) => {
      expect(ayah.number).toBe(index + 1);
    });
  });

  it('matches each surah ayah count in the metadata', () => {
    for (const surah of SURAHS) {
      expect(AYAHS_BY_SURAH.get(surah.number)).toHaveLength(surah.numberOfAyahs);
    }
  });

  it('builds 30 complete juz summaries', () => {
    const summaries = getJuzSummaries();
    expect(summaries).toHaveLength(30);
    expect(summaries.reduce((sum, juz) => sum + juz.ayahCount, 0)).toBe(TOTAL_AYAHS);
  });
});

describe('scope resolution', () => {
  it('recognizes an empty selection', () => {
    expect(
      isScopeEmpty({
        surahNumbers: [],
        pageRange: null,
        juzNumbers: [],
        customRanges: [],
      }),
    ).toBe(true);
  });

  it('unions and deduplicates overlapping criteria', () => {
    const pool = resolveScope({
      surahNumbers: [1, 2],
      pageRange: { from: 1, to: 2 },
      juzNumbers: [],
      customRanges: [{ id: 'range-1', fromSurah: 1, toSurah: 2 }],
    });

    expect(pool.length).toBeGreaterThan(0);
    expect(new Set(pool.map((ayah) => ayah.number)).size).toBe(pool.length);
    expect(pool.every((ayah) => ayah.surahNumber === 1 || ayah.surahNumber === 2)).toBe(
      true,
    );
  });

  it('resolves multiple custom ranges in one scope', () => {
    const pool = resolveScope({
      surahNumbers: [],
      pageRange: null,
      juzNumbers: [],
      customRanges: [
        { id: 'range-1', fromSurah: 2, toSurah: 2 },
        { id: 'range-2', fromSurah: 24, toSurah: 24 },
      ],
    });

    const surahs = new Set(pool.map((ayah) => ayah.surahNumber));
    expect([...surahs].sort((a, b) => a - b)).toEqual([2, 24]);
  });

  it('reports unique page and surah counts', () => {
    const stats = getScopeStats({
      surahNumbers: [1],
      pageRange: null,
      juzNumbers: [],
      customRanges: [],
    });

    expect(stats.ayahCount).toBe(7);
    expect(stats.pageCount).toBe(1);
    expect(stats.surahCount).toBe(1);
    expect(stats.pageNumbers).toEqual([1]);
  });
});
