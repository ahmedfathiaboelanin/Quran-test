import type {
  AyahRef,
  DistributionUnit,
  Question,
  QuestionSegmentKind,
} from '../types';

export interface GenerateQuestionsOptions {
  unit?: DistributionUnit;
  /** Injectable RNG to make the algorithm deterministic in tests. */
  random?: () => number;
}

export interface GenerateQuestionsResult {
  questions: Question[];
  requestedCount: number;
  actualCount: number;
  unitUsed: QuestionSegmentKind;
  /** True when the requested count exceeded the number of available units. */
  capped: boolean;
}

/**
 * Splits `items` into exactly `segmentCount` contiguous segments.
 * Segment sizes differ by at most one, so every part of the range is covered.
 */
export function createBalancedSegments<T>(items: T[], segmentCount: number): T[][] {
  if (items.length === 0 || segmentCount <= 0) return [];

  const count = Math.min(segmentCount, items.length);
  const baseSize = Math.floor(items.length / count);
  const remainder = items.length % count;

  const segments: T[][] = [];
  let cursor = 0;

  for (let index = 0; index < count; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0);
    segments.push(items.slice(cursor, cursor + size));
    cursor += size;
  }

  return segments;
}

function dedupeAndSort(ayahs: AyahRef[]): AyahRef[] {
  const unique = new Map<number, AyahRef>();
  for (const ayah of ayahs) {
    unique.set(ayah.number, ayah);
  }
  return [...unique.values()].sort((a, b) => a.number - b.number);
}

function pickRandom<T>(items: T[], random: () => number): T {
  const index = Math.floor(random() * items.length);
  return items[Math.min(Math.max(index, 0), items.length - 1)];
}

/**
 * Fair distribution algorithm.
 *
 * The resolved pool is split into N contiguous segments, then one random ayah
 * is sampled from each segment. When there are enough pages, the segmentation
 * happens on unique page numbers (one question per page block), which mirrors
 * the classic "100 pages / 10 questions = one question every 10 pages" model.
 * Otherwise it falls back to segmenting the ayah pool directly.
 */
export function generateQuestions(
  pool: AyahRef[],
  requestedCount: number,
  options: GenerateQuestionsOptions = {},
): GenerateQuestionsResult {
  const { unit = 'auto', random = Math.random } = options;
  const sortedPool = dedupeAndSort(pool);
  const requested = Math.max(0, Math.floor(requestedCount));

  if (requested === 0 || sortedPool.length === 0) {
    return {
      questions: [],
      requestedCount: requested,
      actualCount: 0,
      unitUsed: 'ayah',
      capped: false,
    };
  }

  const targetCount = Math.min(requested, sortedPool.length);
  const uniquePages = [...new Set(sortedPool.map((ayah) => ayah.page))].sort(
    (a, b) => a - b,
  );

  // "page" mode gracefully falls back to ayah segmentation when the scope has
  // fewer pages than the requested number of questions.
  const usePages =
    unit !== 'ayah' && uniquePages.length >= targetCount && targetCount > 0;

  if (usePages) {
    const pageAyahs = new Map<number, AyahRef[]>();
    for (const ayah of sortedPool) {
      const group = pageAyahs.get(ayah.page) ?? [];
      group.push(ayah);
      pageAyahs.set(ayah.page, group);
    }

    const segments = createBalancedSegments(uniquePages, targetCount);
    const questions = segments.map((pageSegment, index) => {
      const page = pickRandom(pageSegment, random);
      const candidates = pageAyahs.get(page) ?? [sortedPool[0]];
      const startAyah = pickRandom(candidates, random);

      return {
        id: `q-${index + 1}-${startAyah.number}`,
        index,
        startAyah,
        segment: {
          kind: 'page' as const,
          index,
          from: pageSegment[0],
          to: pageSegment[pageSegment.length - 1],
          count: pageSegment.length,
        },
      } satisfies Question;
    });

    return {
      questions,
      requestedCount: requested,
      actualCount: questions.length,
      unitUsed: 'page',
      capped: targetCount < requested,
    };
  }

  const segments = createBalancedSegments(sortedPool, targetCount);
  const questions = segments.map((ayahSegment, index) => {
    const startAyah = pickRandom(ayahSegment, random);

    return {
      id: `q-${index + 1}-${startAyah.number}`,
      index,
      startAyah,
      segment: {
        kind: 'ayah' as const,
        index,
        from: ayahSegment[0].number,
        to: ayahSegment[ayahSegment.length - 1].number,
        count: ayahSegment.length,
      },
    } satisfies Question;
  });

  return {
    questions,
    requestedCount: requested,
    actualCount: questions.length,
    unitUsed: 'ayah',
    capped: targetCount < requested,
  };
}
