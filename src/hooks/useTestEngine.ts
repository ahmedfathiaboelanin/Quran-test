import { useCallback, useMemo, useReducer } from 'react';
import type {
  Question,
  QuestionEvaluation,
  TestConfig,
  TestPhase,
  TestSummary,
} from '../types';
import {
  getAdjacentAyah,
  getAyah,
  getPageAyahs,
  resolveScope,
} from '../utils/quranHelpers';
import { generateQuestions } from '../utils/samplingAlgorithm';
import { computeEvaluationPoints } from '../utils/scoring';
import { computeTestSummary } from '../utils/testResults';

export interface EvaluationDraft {
  responseMistakes: number;
  promptMistakes: number;
  hesitations: number;
  note: string;
  /** When true, the question is saved as skipped without deduction points. */
  skipped?: boolean;
}

export interface SamplingInfo {
  requestedCount: number;
  actualCount: number;
  unitUsed: 'page' | 'ayah';
  capped: boolean;
}

interface EngineState {
  phase: TestPhase;
  config: TestConfig | null;
  questions: Question[];
  currentIndex: number;
  currentAyahNumber: number | null;
  viewedAyahNumbers: number[];
  evaluations: Record<string, QuestionEvaluation>;
  sampling: SamplingInfo | null;
}

type EngineAction =
  | {
      type: 'START';
      config: TestConfig;
      questions: Question[];
      sampling: SamplingInfo;
    }
  | { type: 'NEXT_AYAH' }
  | { type: 'PREV_AYAH' }
  | { type: 'GO_TO_AYAH'; ayahNumber: number }
  | { type: 'SUBMIT'; evaluation: QuestionEvaluation; finishAfter: boolean }
  | { type: 'FINISH' }
  | {
      type: 'RESTART';
      questions: Question[];
      sampling: SamplingInfo;
    }
  | { type: 'RESET' };

const initialState: EngineState = {
  phase: 'setup',
  config: null,
  questions: [],
  currentIndex: 0,
  currentAyahNumber: null,
  viewedAyahNumbers: [],
  evaluations: {},
  sampling: null,
};

function withViewedAyah(state: EngineState, ayahNumber: number): number[] {
  return state.viewedAyahNumbers.includes(ayahNumber)
    ? state.viewedAyahNumbers
    : [...state.viewedAyahNumbers, ayahNumber];
}

function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'START': {
      const firstQuestion = action.questions[0];
      if (!firstQuestion) return state;

      return {
        ...initialState,
        phase: 'running',
        config: action.config,
        questions: action.questions,
        currentIndex: 0,
        currentAyahNumber: firstQuestion.startAyah.number,
        viewedAyahNumbers: [firstQuestion.startAyah.number],
        sampling: action.sampling,
      };
    }

    case 'NEXT_AYAH': {
      if (state.currentAyahNumber === null) return state;
      const next = getAdjacentAyah(state.currentAyahNumber, 1);
      if (!next) return state;

      return {
        ...state,
        currentAyahNumber: next.number,
        viewedAyahNumbers: withViewedAyah(state, next.number),
      };
    }

    case 'PREV_AYAH': {
      if (state.currentAyahNumber === null) return state;
      const previous = getAdjacentAyah(state.currentAyahNumber, -1);
      if (!previous) return state;

      return {
        ...state,
        currentAyahNumber: previous.number,
        viewedAyahNumbers: withViewedAyah(state, previous.number),
      };
    }

    case 'GO_TO_AYAH': {
      return {
        ...state,
        currentAyahNumber: action.ayahNumber,
        viewedAyahNumbers: withViewedAyah(state, action.ayahNumber),
      };
    }

    case 'SUBMIT': {
      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) return state;

      const evaluations = {
        ...state.evaluations,
        [action.evaluation.questionId]: action.evaluation,
      };

      const isLast = state.currentIndex >= state.questions.length - 1;
      if (action.finishAfter || isLast) {
        return { ...state, evaluations, phase: 'results' };
      }

      const nextIndex = state.currentIndex + 1;
      const nextQuestion = state.questions[nextIndex];

      return {
        ...state,
        evaluations,
        currentIndex: nextIndex,
        currentAyahNumber: nextQuestion.startAyah.number,
        viewedAyahNumbers: [nextQuestion.startAyah.number],
      };
    }

    case 'FINISH':
      return { ...state, phase: 'results' };

    case 'RESTART': {
      const firstQuestion = action.questions[0];
      if (!firstQuestion) return state;

      return {
        ...state,
        phase: 'running',
        questions: action.questions,
        currentIndex: 0,
        currentAyahNumber: firstQuestion.startAyah.number,
        viewedAyahNumbers: [firstQuestion.startAyah.number],
        evaluations: {},
        sampling: action.sampling,
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export interface TestEngine {
  phase: TestPhase;
  config: TestConfig | null;
  questions: Question[];
  currentQuestion: Question | null;
  currentAyahNumber: number | null;
  currentAyah: ReturnType<typeof getAyah> | null;
  currentIndex: number;
  totalQuestions: number;
  viewedAyahs: number;
  sampling: SamplingInfo | null;
  evaluations: Record<string, QuestionEvaluation>;
  summary: TestSummary;
  canGoNextAyah: boolean;
  canGoPreviousAyah: boolean;
  isAtQuestionStart: boolean;
  progressPercent: number;
  startTest: (config: TestConfig) => void;
  nextAyah: () => void;
  previousAyah: () => void;
  goToAyah: (ayahNumber: number) => void;
  goToQuestionStart: () => void;
  submitEvaluation: (draft: EvaluationDraft, finishAfter?: boolean) => void;
  finishTest: () => void;
  restartSameScope: () => void;
  resetTest: () => void;
}

/**
 * Main state machine for the test lifecycle: setup → running → results.
 * Uses the fair sampling algorithm to generate one question per scope segment.
 */
export function useTestEngine(): TestEngine {
  const [state, dispatch] = useReducer(engineReducer, initialState);

  const generate = useCallback((config: TestConfig) => {
    const pool = resolveScope(config.scope);
    const generated = generateQuestions(pool, config.questionCount, {
      unit: config.distributionUnit,
      shuffleQuestions: config.randomizeQuestionOrder,
    });

    return {
      questions: generated.questions,
      sampling: {
        requestedCount: generated.requestedCount,
        actualCount: generated.actualCount,
        unitUsed: generated.unitUsed,
        capped: generated.capped,
      } satisfies SamplingInfo,
    };
  }, []);

  const startTest = useCallback(
    (config: TestConfig) => {
      const { questions, sampling } = generate(config);
      if (questions.length === 0) return;
      dispatch({ type: 'START', config, questions, sampling });
    },
    [generate],
  );

  const nextAyah = useCallback(() => dispatch({ type: 'NEXT_AYAH' }), []);
  const previousAyah = useCallback(() => dispatch({ type: 'PREV_AYAH' }), []);
  const goToAyah = useCallback(
    (ayahNumber: number) => dispatch({ type: 'GO_TO_AYAH', ayahNumber }),
    [],
  );

  const currentQuestion = state.questions[state.currentIndex] ?? null;

  const goToQuestionStart = useCallback(() => {
    if (!currentQuestion) return;
    dispatch({ type: 'GO_TO_AYAH', ayahNumber: currentQuestion.startAyah.number });
  }, [currentQuestion]);

  const reviewedAyahs = useMemo(() => {
    if (state.config?.displayMode !== 'page') return state.viewedAyahNumbers.length;

    const pages = new Set<number>();
    for (const ayahNumber of state.viewedAyahNumbers) {
      const ayah = getAyah(ayahNumber);
      if (ayah) pages.add(ayah.page);
    }
    return [...pages].reduce(
      (total, page) => total + getPageAyahs(page).length,
      0,
    );
  }, [state.config?.displayMode, state.viewedAyahNumbers]);

  const submitEvaluation = useCallback(
    (draft: EvaluationDraft, finishAfter = false) => {
      if (!currentQuestion) return;

      const responseMistakes = draft.skipped ? 0 : draft.responseMistakes;
      const promptMistakes = draft.skipped ? 0 : draft.promptMistakes;
      const hesitations = draft.skipped ? 0 : draft.hesitations;

      const evaluation: QuestionEvaluation = {
        questionId: currentQuestion.id,
        points: draft.skipped
          ? null
          : computeEvaluationPoints({ responseMistakes, promptMistakes, hesitations }),
        responseMistakes,
        promptMistakes,
        hesitations,
        note: draft.note.trim(),
        reviewedAyahs,
        completedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SUBMIT', evaluation, finishAfter });
    },
    [currentQuestion, reviewedAyahs],
  );

  const finishTest = useCallback(() => dispatch({ type: 'FINISH' }), []);

  const restartSameScope = useCallback(() => {
    if (!state.config) return;
    const { questions, sampling } = generate(state.config);
    if (questions.length === 0) return;
    dispatch({ type: 'RESTART', questions, sampling });
  }, [generate, state.config]);

  const resetTest = useCallback(() => dispatch({ type: 'RESET' }), []);

  const currentAyah = useMemo(() => {
    if (state.currentAyahNumber === null) return null;
    return getAyah(state.currentAyahNumber) ?? null;
  }, [state.currentAyahNumber]);

  const summary = useMemo(
    () => computeTestSummary(state.questions, state.evaluations),
    [state.questions, state.evaluations],
  );

  const canGoPreviousAyah = useMemo(
    () =>
      state.currentAyahNumber !== null &&
      getAdjacentAyah(state.currentAyahNumber, -1) !== undefined,
    [state.currentAyahNumber],
  );

  const canGoNextAyah = useMemo(
    () =>
      state.currentAyahNumber !== null &&
      getAdjacentAyah(state.currentAyahNumber, 1) !== undefined,
    [state.currentAyahNumber],
  );

  const isAtQuestionStart =
    currentQuestion !== null && state.currentAyahNumber === currentQuestion.startAyah.number;

  const progressPercent =
    state.questions.length > 0
      ? Math.round((state.currentIndex / state.questions.length) * 100)
      : 0;

  return {
    phase: state.phase,
    config: state.config,
    questions: state.questions,
    currentQuestion,
    currentAyahNumber: state.currentAyahNumber,
    currentAyah,
    currentIndex: state.currentIndex,
    totalQuestions: state.questions.length,
    viewedAyahs: reviewedAyahs,
    sampling: state.sampling,
    evaluations: state.evaluations,
    summary,
    canGoNextAyah,
    canGoPreviousAyah,
    isAtQuestionStart,
    progressPercent,
    startTest,
    nextAyah,
    previousAyah,
    goToAyah,
    goToQuestionStart,
    submitEvaluation,
    finishTest,
    restartSameScope,
    resetTest,
  };
}
