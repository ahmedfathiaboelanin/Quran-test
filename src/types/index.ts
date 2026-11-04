/** Domain types shared across the application. */

export type RevelationType = 'Meccan' | 'Medinan' | string;

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: RevelationType;
}

export interface AyahData {
  /** Global ayah number (1–6236). */
  number: number;
  /** Ayah number inside its surah. */
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
}

export interface RawSurah extends SurahMeta {
  ayahs: AyahData[];
}

/** An ayah enriched with its surah metadata, used throughout the UI. */
export interface AyahRef extends AyahData {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  surahTranslation: string;
}

export interface PageRange {
  from: number;
  to: number;
}

export interface SurahRange {
  id: string;
  fromSurah: number;
  toSurah: number;
}

/**
 * All scope criteria are combined with a union (logical OR) and deduplicated,
 * so the examiner can mix surahs, pages, juz and custom ranges freely.
 */
export interface ScopeSelection {
  surahNumbers: number[];
  pageRange: PageRange | null;
  juzNumbers: number[];
  customRanges: SurahRange[];
}

export type ScopeTab = 'surah' | 'pages' | 'juz' | 'ranges';

export type TestPhase = 'setup' | 'running' | 'results';

export type DistributionUnit = 'auto' | 'page' | 'ayah';

export interface TestConfig {
  scope: ScopeSelection;
  questionCount: number;
  distributionUnit: DistributionUnit;
  blindMode: boolean;
}

export type QuestionSegmentKind = 'page' | 'ayah';

export interface QuestionSegment {
  kind: QuestionSegmentKind;
  /** Zero-based segment index inside the sampled pool. */
  index: number;
  /** First page or first global ayah number of the segment. */
  from: number;
  /** Last page or last global ayah number of the segment. */
  to: number;
  /** Number of pages or ayaat covered by the segment. */
  count: number;
}

export interface Question {
  id: string;
  /** Zero-based question index. */
  index: number;
  startAyah: AyahRef;
  segment: QuestionSegment;
}

export interface QuestionEvaluation {
  questionId: string;
  /**
   * Deduction points decided by the examiner: 0 = no mistakes,
   * each clear mistake = 1, each hesitation = 0.5.
   * `null` means the question was skipped without evaluation.
   */
  points: number | null;
  /** Number of clear memorization mistakes. */
  hifzMistakes: number;
  /** Number of clear tajweed mistakes. */
  tajweedMistakes: number;
  /** Number of hesitations (half a point each). */
  hesitations: number;
  note: string;
  /** Number of distinct ayaat the examiner opened for this question. */
  reviewedAyahs: number;
  completedAt: string;
}

export interface ScopeStats {
  ayahCount: number;
  pageCount: number;
  surahCount: number;
  pageNumbers: number[];
}

export interface JuzSummary {
  number: number;
  ayahCount: number;
  firstAyah: AyahRef;
  lastAyah: AyahRef;
  firstSurahName: string;
  lastSurahName: string;
}

export interface SurahRevisionItem {
  surahNumber: number;
  surahName: string;
  questions: number;
  /** Total deduction points accumulated in this surah. */
  points: number;
  /** Clear mistakes (memorization + tajweed). */
  mistakes: number;
  hesitations: number;
}

export interface QuestionResult {
  question: Question;
  evaluation: QuestionEvaluation | null;
}

export interface TestSummary {
  totalQuestions: number;
  /** Saved evaluations, including skipped questions. */
  reviewedQuestions: number;
  /** Evaluated questions (have deduction points). */
  ratedQuestions: number;
  unratedQuestions: number;
  /** Sum of deduction points. Lower is better. */
  totalPoints: number;
  averagePoints: number | null;
  /** Questions evaluated with zero mistakes. */
  cleanQuestions: number;
  /** Clear mistakes (memorization + tajweed). */
  totalMistakes: number;
  hifzMistakes: number;
  tajweedMistakes: number;
  hesitations: number;
  revisionSurahs: SurahRevisionItem[];
  results: QuestionResult[];
  completedAt: string | null;
}

export interface ScopePreset {
  id: string;
  label: string;
  description: string;
  tab: ScopeTab;
  selection: ScopeSelection;
}
