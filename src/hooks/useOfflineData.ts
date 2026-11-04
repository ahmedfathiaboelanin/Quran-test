import { useCallback, useEffect, useMemo, useState } from 'react';
import { SURAHS, TOTAL_AYAHS, TOTAL_JUZ, TOTAL_PAGES } from '../data/quranData';
import { getJuzSummaries } from '../utils/quranHelpers';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/**
 * Exposes the local Quran dataset and connectivity/PWA installation state.
 * The data is bundled at build time, so it is available even when offline.
 */
export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return 'unavailable' as const;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
    return choice.outcome;
  }, [installPrompt]);

  const juzSummaries = useMemo(() => getJuzSummaries(), []);

  return {
    surahs: SURAHS,
    juzSummaries,
    dataStats: {
      surahs: SURAHS.length,
      ayaat: TOTAL_AYAHS,
      pages: TOTAL_PAGES,
      juz: TOTAL_JUZ,
    },
    isOnline,
    canInstall: installPrompt !== null && !isStandalone,
    isStandalone,
    installApp,
  };
}
