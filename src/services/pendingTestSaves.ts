import type { SaveTestTarget } from '../types/monthlySheet';
import { saveTestScore } from './monthlySheetService';

const STORAGE_KEY = 'quran_pending_test_saves_v1';
const CHANGE_EVENT = 'quran-pending-test-saves-changed';

export interface PendingTestSave {
  id: string;
  target: SaveTestTarget;
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
      return (
        typeof candidate.id === 'string' &&
        Boolean(candidate.target) &&
        typeof candidate.target?.sheetId === 'string' &&
        typeof candidate.target?.examineeId === 'string' &&
        typeof candidate.target?.slot === 'string' &&
        typeof candidate.target?.score === 'number'
      );
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

function isSameTarget(a: SaveTestTarget, b: SaveTestTarget): boolean {
  return (
    a.sheetId === b.sheetId &&
    a.examineeId === b.examineeId &&
    a.slot === b.slot
  );
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
export function enqueuePendingTestSave(target: SaveTestTarget): PendingTestSave {
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
        await saveTestScore(entry.target);
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
