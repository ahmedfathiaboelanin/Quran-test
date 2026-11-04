import {
  ALL_AYAHS,
  AYAH_BY_NUMBER,
  AYAH_INDEX_BY_NUMBER,
  AYAHS_BY_SURAH,
  AYAH_NUMBERS_BY_JUZ,
  SURAH_BY_NUMBER,
  SURAHS,
  TOTAL_AYAHS,
  TOTAL_JUZ,
  TOTAL_PAGES,
} from '../data/quranData';
import type {
  AyahRef,
  JuzSummary,
  ScopeSelection,
  ScopeStats,
  SurahMeta,
} from '../types';
import { formatNumber } from './helpers';

export {
  ALL_AYAHS,
  AYAH_BY_NUMBER,
  AYAHS_BY_SURAH,
  SURAHS,
  TOTAL_AYAHS,
  TOTAL_JUZ,
  TOTAL_PAGES,
};

export function getSurah(surahNumber: number): SurahMeta | undefined {
  return SURAH_BY_NUMBER.get(surahNumber);
}

export function getSurahName(surahNumber: number): string {
  return SURAH_BY_NUMBER.get(surahNumber)?.name ?? `سورة ${surahNumber}`;
}

export function getAyah(globalNumber: number): AyahRef | undefined {
  return AYAH_BY_NUMBER.get(globalNumber);
}

export function getAdjacentAyah(
  globalNumber: number,
  direction: 1 | -1,
): AyahRef | undefined {
  const index = AYAH_INDEX_BY_NUMBER.get(globalNumber);
  if (index === undefined) return undefined;
  return ALL_AYAHS[index + direction];
}

export function isScopeEmpty(selection: ScopeSelection): boolean {
  return (
    selection.surahNumbers.length === 0 &&
    selection.pageRange === null &&
    selection.juzNumbers.length === 0 &&
    selection.customRanges.length === 0
  );
}

/**
 * Resolves every selected criterion (surahs, page range, juz, custom ranges)
 * into one sorted, deduplicated ayah pool.
 */
export function resolveScope(selection: ScopeSelection): AyahRef[] {
  if (isScopeEmpty(selection)) return [];

  const selected = new Map<number, AyahRef>();

  for (const surahNumber of selection.surahNumbers) {
    for (const ayah of AYAHS_BY_SURAH.get(surahNumber) ?? []) {
      selected.set(ayah.number, ayah);
    }
  }

  if (selection.pageRange) {
    const from = Math.min(selection.pageRange.from, selection.pageRange.to);
    const to = Math.max(selection.pageRange.from, selection.pageRange.to);
    for (const ayah of ALL_AYAHS) {
      if (ayah.page >= from && ayah.page <= to) {
        selected.set(ayah.number, ayah);
      }
    }
  }

  for (const juzNumber of selection.juzNumbers) {
    for (const ayah of AYAH_NUMBERS_BY_JUZ.get(juzNumber) ?? []) {
      selected.set(ayah.number, ayah);
    }
  }

  for (const range of selection.customRanges) {
    const from = Math.min(range.fromSurah, range.toSurah);
    const to = Math.max(range.fromSurah, range.toSurah);
    for (let surahNumber = from; surahNumber <= to; surahNumber += 1) {
      for (const ayah of AYAHS_BY_SURAH.get(surahNumber) ?? []) {
        selected.set(ayah.number, ayah);
      }
    }
  }

  return [...selected.values()].sort((a, b) => a.number - b.number);
}

export function getScopeStats(selection: ScopeSelection): ScopeStats {
  const ayahs = resolveScope(selection);
  const pageNumbers = [...new Set(ayahs.map((ayah) => ayah.page))].sort(
    (a, b) => a - b,
  );
  const surahCount = new Set(ayahs.map((ayah) => ayah.surahNumber)).size;

  return {
    ayahCount: ayahs.length,
    pageCount: pageNumbers.length,
    surahCount,
    pageNumbers,
  };
}

export function getJuzSummaries(): JuzSummary[] {
  return Array.from({ length: TOTAL_JUZ }, (_, index) => {
    const number = index + 1;
    const ayahs = AYAH_NUMBERS_BY_JUZ.get(number) ?? [];
    const firstAyah = ayahs[0] ?? ALL_AYAHS[0];
    const lastAyah = ayahs[ayahs.length - 1] ?? ALL_AYAHS[ALL_AYAHS.length - 1];

    return {
      number,
      ayahCount: ayahs.length,
      firstAyah,
      lastAyah,
      firstSurahName: firstAyah.surahName,
      lastSurahName: lastAyah.surahName,
    };
  });
}

export function getSurahRangeLabel(fromSurah: number, toSurah: number): string {
  const from = Math.min(fromSurah, toSurah);
  const to = Math.max(fromSurah, toSurah);
  if (from === to) return getSurahName(from);
  return `من ${getSurahName(from)} إلى ${getSurahName(to)}`;
}

export function getRevelationLabel(type: string): string {
  if (type === 'Meccan') return 'مكية';
  if (type === 'Medinan') return 'مدنية';
  return type;
}

export function getAyahReferenceLabel(ayah: AyahRef): string {
  return `${ayah.surahName} • الآية ${formatNumber(ayah.numberInSurah)}`;
}

export function getSurahEnglishLabel(surah: SurahMeta): string {
  return `${surah.englishName} — ${surah.englishNameTranslation}`;
}
