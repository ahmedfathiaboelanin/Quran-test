import { describe, expect, it } from 'vitest';
import {
  EMPTY_SELECTION,
  mergeSelections,
  SCOPE_PRESETS,
} from '../presets';
import { resolveScope } from '../../utils/quranHelpers';

const mufassal = SCOPE_PRESETS.find((preset) => preset.id === 'mufassal')!;

describe('mergeSelections', () => {
  it('keeps existing criteria and adds the preset scope', () => {
    const base = {
      ...EMPTY_SELECTION,
      pageRange: { from: 1, to: 10 },
      surahNumbers: [1],
    };

    const merged = mergeSelections(base, mufassal.selection);

    expect(merged.pageRange).toEqual({ from: 1, to: 10 });
    expect(merged.surahNumbers).toEqual([1]);
    expect(merged.customRanges).toEqual(mufassal.selection.customRanges);
  });

  it('unions «المفصل» with another custom range without duplicates', () => {
    const base = {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'my-range', fromSurah: 2, toSurah: 4 }],
    };

    const merged = mergeSelections(base, mufassal.selection);
    expect(merged.customRanges).toHaveLength(2);
    expect(merged.customRanges.map((range) => [range.fromSurah, range.toSurah])).toEqual([
      [2, 4],
      [50, 114],
    ]);

    const pool = resolveScope(merged);
    const surahs = new Set(pool.map((ayah) => ayah.surahNumber));
    expect(surahs.has(2)).toBe(true);
    expect(surahs.has(50)).toBe(true);
    expect(surahs.has(114)).toBe(true);
    expect(surahs.has(49)).toBe(false);
  });

  it('does not add the same custom range twice', () => {
    const once = mergeSelections(EMPTY_SELECTION, mufassal.selection);
    const twice = mergeSelections(once, mufassal.selection);

    expect(twice.customRanges).toHaveLength(1);
    expect(twice).toEqual(once);
  });

  it('deduplicates surahs and juz and expands page ranges', () => {
    const merged = mergeSelections(
      {
        surahNumbers: [1, 2],
        pageRange: { from: 5, to: 10 },
        juzNumbers: [30],
        customRanges: [],
      },
      {
        surahNumbers: [2, 3],
        pageRange: { from: 1, to: 7 },
        juzNumbers: [29, 30],
        customRanges: [],
      },
    );

    expect(merged.surahNumbers).toEqual([1, 2, 3]);
    expect(merged.juzNumbers).toEqual([29, 30]);
    expect(merged.pageRange).toEqual({ from: 1, to: 10 });
  });

  it('does not mutate the base selection', () => {
    const base = {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'my-range', fromSurah: 2, toSurah: 4 }],
    };
    mergeSelections(base, mufassal.selection);

    expect(base.customRanges).toEqual([{ id: 'my-range', fromSurah: 2, toSurah: 4 }]);
  });
});
