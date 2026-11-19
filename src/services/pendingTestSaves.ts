import type { QueuedTestTarget } from '../types/monthlySheet';
import { saveResolvedTestScore } from './monthlySheetService';

const STORAGE_KEY = 'quran_pending_test_saves_v1';
const CHANGE_EVENT = 'quran-pending-test-saves-changed';

export interface PendingTestSave {
  id: string;
  target: QueuedTestTarget;
  createdAt: string;
}

export interface FlushResult {
  saved: number;
  failed: number;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;

  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof TypeError) return true;
    if (current instanceof Error) {
      const message = current.message.toLowerCase();
      if (
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('offline')
      ) {
        return true;
      }
      current = (current as Error & { cause?: unknown }).cause;
      continue;
    }
    break;
  }

  return false;
}

function emitChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function isQueuedTarget(value: unknown): value is QueuedTestTarget {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QueuedTestTarget>;
  const hasExaminee = Boolean(
    candidate.examineeId || candidate.examineeName?.trim(),
  );
  return (
    typeof candidate.slot === 'string' &&
    typeof candidate.score === 'number' &&
    hasExaminee
  );
}

function readQueue(): PendingTestSave[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PendingTestSave => {
      if (!entry || typeof entry !== 'object') return false;
      const candidate = entry as Partial<PendingTestSave>;
      return typeof candidate.id === 'string' && isQueuedTarget(candidate.target);
    });
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingTestSave[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota errors; the in-memory toast still informs the user.
  }
  emitChange();
}

function sameExaminee(a: QueuedTestTarget, b: QueuedTestTarget): boolean {
  if (a.examineeId && b.examineeId) return a.examineeId === b.examineeId;
  return (
    (a.examineeName ?? '').trim() === (b.examineeName ?? '').trim()
  );
}

function sameSheet(a: QueuedTestTarget, b: QueuedTestTarget): boolean {
  if (a.sheetId && b.sheetId) return a.sheetId === b.sheetId;
  return (a.sheetTitle ?? '').trim() === (b.sheetTitle ?? '').trim();
}

function isSameTarget(a: QueuedTestTarget, b: QueuedTestTarget): boolean {
  return a.slot === b.slot && sameExaminee(a, b) && sameSheet(a, b);
}

export function getPendingTestSaves(): PendingTestSave[] {
  return readQueue();
}

export function subscribePendingTestSaves(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Queues a score locally; a newer save for the same slot replaces the old one. */
export function enqueuePendingTestSave(target: QueuedTestTarget): PendingTestSave {
  const queue = readQueue().filter((entry) => !isSameTarget(entry.target, target));
  const entry: PendingTestSave = {
    id: `pending-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    target,
    createdAt: new Date().toISOString(),
  };
  writeQueue([...queue, entry]);
  return entry;
}

let flushing = false;

/**
 * Sends queued scores to Supabase. Network failures keep the entry for the
 * next reconnection; other failures are kept too so no result is ever lost.
 */
export async function flushPendingTestSaves(): Promise<FlushResult> {
  if (flushing) return { saved: 0, failed: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { saved: 0, failed: 0 };
  }

  flushing = true;
  let saved = 0;
  let failed = 0;

  try {
    const queue = readQueue();
    for (const entry of queue) {
      try {
        await saveResolvedTestScore(entry.target);
        saved += 1;
        const remaining = readQueue().filter((item) => item.id !== entry.id);
        writeQueue(remaining);
      } catch (error) {
        failed += 1;
        if (isNetworkFailure(error)) break;
      }
    }
  } finally {
    flushing = false;
  }

  return { saved, failed };
}
