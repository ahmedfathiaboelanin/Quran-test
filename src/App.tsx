import { useState } from 'react';
import { Database, ShieldCheck, WifiOff } from 'lucide-react';
import { useOfflineData } from './hooks/useOfflineData';
import { useTestEngine } from './hooks/useTestEngine';
import { AppHeader } from './components/Layout/AppHeader';
import { SetupView } from './components/SetupView/SetupView';
import { TestingView } from './components/TestingView/TestingView';
import { ResultsView } from './components/ResultsView/ResultsView';
import { UsageGuideModal } from './components/Help/UsageGuideModal';
import type { TestConfig } from './types';
import { formatNumber } from './utils/helpers';

export default function App() {
  const data = useOfflineData();
  const engine = useTestEngine();
  const [lastConfig, setLastConfig] = useState<TestConfig | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleStart = (config: TestConfig) => {
    setLastConfig(config);
    engine.startTest(config);
  };

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <AppHeader
          isOnline={data.isOnline}
          canInstall={data.canInstall}
          onInstall={() => {
            void data.installApp();
          }}
          onHelp={() => setHelpOpen(true)}
          dataStats={data.dataStats}
        />
      </div>

      {!data.isOnline ? (
        <div className="border-b border-amber-200 bg-amber-50/90 print:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2 text-[11px] font-medium text-amber-800 sm:px-6 lg:px-8">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            لا يوجد اتصال بالإنترنت — جميع البيانات محلية والتطبيق يعمل بكامل
            وظائفه.
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div key={engine.phase} className="screen-enter">
          {engine.phase === 'setup' ? (
            <SetupView
              surahs={data.surahs}
              juzSummaries={data.juzSummaries}
              initialConfig={lastConfig}
              onStart={handleStart}
            />
          ) : null}

          {engine.phase === 'running' ? <TestingView engine={engine} /> : null}

          {engine.phase === 'results' ? (
            <ResultsView
              summary={engine.summary}
              config={engine.config ?? lastConfig}
              onRestartSameScope={engine.restartSameScope}
              onNewTest={engine.resetTest}
            />
          ) : null}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 pt-2 sm:px-6 lg:px-8 print:hidden">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-stone-200/80 pt-4 text-[10px] text-stone-400 sm:flex-row">
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            خصوصية كاملة: لا تُرسل أي بيانات، ولا تُجرى أي طلبات شبكة أثناء الاستخدام.
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            {formatNumber(data.dataStats.surahs)} سورة •{' '}
            {formatNumber(data.dataStats.ayaat)} آية •{' '}
            {formatNumber(data.dataStats.pages)} صفحة •{' '}
            {formatNumber(data.dataStats.juz)} جزءًا
          </p>
        </div>
      </footer>

      {helpOpen ? <UsageGuideModal onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
