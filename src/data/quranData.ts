import type { AyahRef, RawSurah, SurahMeta } from '../types';
import surahsMetadata from './quran/surahs.json';

/**
 * All Quran data is imported eagerly at build time. This keeps the application
 * 100% offline: no network requests are made at runtime and the whole dataset
 * is precached by the service worker as part of the JS bundle.
 */
const surahModules = import.meta.glob<RawSurah>('./quran/surahs/*.json', {
  eager: true,
  import: 'default',
});

const metadataByNumber = new Map(
  (surahsMetadata as SurahMeta[]).map((surah) => [surah.number, surah]),
);

const rawSurahs = Object.values(surahModules).sort((a, b) => a.number - b.number);

const cleanText = (text: string) => text.replace(/^\uFEFF/, '').trim();

export const SURAHS: SurahMeta[] = rawSurahs.map((raw) => {
  const metadata = metadataByNumber.get(raw.number);
  return {
    number: raw.number,
    name: metadata?.name ?? raw.name,
    englishName: metadata?.englishName ?? raw.englishName,
    englishNameTranslation: metadata?.englishNameTranslation ?? '',
    numberOfAyahs: raw.numberOfAyahs,
    revelationType: metadata?.revelationType ?? raw.revelationType,
  };
});

export const SURAH_BY_NUMBER = new Map(SURAHS.map((surah) => [surah.number, surah]));

export const AYAHS_BY_SURAH = new Map<number, AyahRef[]>();

/** Every ayah in the mushaf, enriched with surah metadata and sorted by global number. */
export const ALL_AYAHS: AyahRef[] = rawSurahs.flatMap((raw) => {
  const surah = SURAH_BY_NUMBER.get(raw.number);
  if (!surah) return [];

  const ayahs: AyahRef[] = raw.ayahs
    .map((ayah) => ({
      ...ayah,
      text: cleanText(ayah.text),
      surahNumber: surah.number,
      surahName: surah.name,
      surahEnglishName: surah.englishName,
      surahTranslation: surah.englishNameTranslation,
    }))
    .sort((a, b) => a.number - b.number);

  AYAHS_BY_SURAH.set(surah.number, ayahs);
  return ayahs;
}).sort((a, b) => a.number - b.number);

export const AYAH_BY_NUMBER = new Map(ALL_AYAHS.map((ayah) => [ayah.number, ayah]));

export const AYAH_INDEX_BY_NUMBER = new Map(
  ALL_AYAHS.map((ayah, index) => [ayah.number, index]),
);

export const AYAH_NUMBERS_BY_PAGE = new Map<number, AyahRef[]>();
export const AYAH_NUMBERS_BY_JUZ = new Map<number, AyahRef[]>();

for (const ayah of ALL_AYAHS) {
  const pageAyahs = AYAH_NUMBERS_BY_PAGE.get(ayah.page) ?? [];
  pageAyahs.push(ayah);
  AYAH_NUMBERS_BY_PAGE.set(ayah.page, pageAyahs);

  const juzAyahs = AYAH_NUMBERS_BY_JUZ.get(ayah.juz) ?? [];
  juzAyahs.push(ayah);
  AYAH_NUMBERS_BY_JUZ.set(ayah.juz, juzAyahs);
}

export const TOTAL_AYAHS = ALL_AYAHS.length;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
