import type { ScopePreset, ScopeSelection } from '../types';

export const EMPTY_SELECTION: ScopeSelection = {
  surahNumbers: [],
  pageRange: null,
  juzNumbers: [],
  customRanges: [],
};

export const makeRangeId = () =>
  `range-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'full-quran',
    label: 'القرآن كامل',
    description: 'من الفاتحة إلى الناس',
    tab: 'ranges',
    selection: {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'preset-full', fromSurah: 1, toSurah: 114 }],
    },
  },
  {
    id: 'mufassal',
    label: 'المفصل',
    description: 'من سورة ق إلى الناس',
    tab: 'ranges',
    selection: {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'preset-mufassal', fromSurah: 50, toSurah: 114 }],
    },
  },
  {
    id: 'juz-amma',
    label: 'جزء عمّ',
    description: 'الجزء الثلاثون',
    tab: 'juz',
    selection: { ...EMPTY_SELECTION, juzNumbers: [30] },
  },
  {
    id: 'juz-tabarak',
    label: 'جزء تبارك',
    description: 'الجزء التاسع والعشرون',
    tab: 'juz',
    selection: { ...EMPTY_SELECTION, juzNumbers: [29] },
  },
  {
    id: 'last-ten-surahs',
    label: 'العشر الأخير',
    description: 'من سورة العاديات إلى الناس',
    tab: 'ranges',
    selection: {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'preset-last-ten', fromSurah: 100, toSurah: 114 }],
    },
  },
  {
    id: 'baqarah-to-nas',
    label: 'من البقرة إلى الناس',
    description: 'الجزء الأول بعد الفاتحة حتى الختام',
    tab: 'ranges',
    selection: {
      ...EMPTY_SELECTION,
      customRanges: [{ id: 'preset-baqarah', fromSurah: 2, toSurah: 114 }],
    },
  },
];

export const cloneSelection = (selection: ScopeSelection): ScopeSelection => ({
  surahNumbers: [...selection.surahNumbers],
  pageRange: selection.pageRange ? { ...selection.pageRange } : null,
  juzNumbers: [...selection.juzNumbers],
  customRanges: selection.customRanges.map((range) => ({ ...range })),
});

const normalizeRange = (fromSurah: number, toSurah: number) => ({
  fromSurah: Math.min(fromSurah, toSurah),
  toSurah: Math.max(fromSurah, toSurah),
});

/**
 * Adds `addition` to `base` instead of replacing it, so presets and manual
 * selections can be combined freely (e.g. «المفصل» + a page range).
 * Duplicate surahs, juz and identical custom ranges are removed.
 */
export function mergeSelections(
  base: ScopeSelection,
  addition: ScopeSelection,
): ScopeSelection {
  const surahNumbers = [...new Set([...base.surahNumbers, ...addition.surahNumbers])].sort(
    (a, b) => a - b,
  );
  const juzNumbers = [...new Set([...base.juzNumbers, ...addition.juzNumbers])].sort(
    (a, b) => a - b,
  );

  const customRanges = base.customRanges.map((range) => ({ ...range }));
  for (const range of addition.customRanges) {
    const normalized = normalizeRange(range.fromSurah, range.toSurah);
    const alreadyIncluded = customRanges.some((existing) => {
      const existingRange = normalizeRange(existing.fromSurah, existing.toSurah);
      return (
        existingRange.fromSurah === normalized.fromSurah &&
        existingRange.toSurah === normalized.toSurah
      );
    });
    if (!alreadyIncluded) {
      customRanges.push({ ...range, ...normalized });
    }
  }

  let pageRange = base.pageRange ? { ...base.pageRange } : null;
  if (addition.pageRange) {
    pageRange = pageRange
      ? {
          from: Math.min(pageRange.from, addition.pageRange.from),
          to: Math.max(pageRange.to, addition.pageRange.to),
        }
      : { ...addition.pageRange };
  }

  return { surahNumbers, pageRange, juzNumbers, customRanges };
}
