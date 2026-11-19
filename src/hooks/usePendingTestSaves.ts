import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { cacheMonthlyPickerData } from '../services/monthlySheetService';
import {
  flushPendingTestSaves,
  getPendingTestSaves,
  subscribePendingTestSaves,
} from '../services/pendingTestSaves';

/** Tracks offline-queued scores and flushes them as soon as the app is online. */
export function usePendingTestSaves() {
  const [pendingCount, setPendingCount] = useState(
    () => getPendingTestSaves().length,
  );

  useEffect(() => {
    const syncCount = () => setPendingCount(getPendingTestSaves().length);

    const flush = () => {
      if (!isSupabaseConfigured) return;
      void cacheMonthlyPickerData();
      void flushPendingTestSaves().finally(syncCount);
    };

    syncCount();
    flush();

    const unsubscribe = subscribePendingTestSaves(syncCount);
    const handleOnline = () => {
      syncCount();
      flush();
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') handleOnline();
    };
    const retryTimer = window.setInterval(() => {
      if (getPendingTestSaves().length > 0) flush();
    }, 30_000);

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisible);
      window.clearInterval(retryTimer);
    };
  }, []);

  return pendingCount;
}
