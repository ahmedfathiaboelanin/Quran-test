import { useEffect, useState } from 'react';
import { Database, ShieldCheck, WifiOff } from 'lucide-react';
import { useOfflineData } from './hooks/useOfflineData';
import { useTestEngine } from './hooks/useTestEngine';
import { useTheme } from './hooks/useTheme';
import { AppHeader } from './components/Layout/AppHeader';
import { WorkspaceNav } from './components/Layout/WorkspaceNav';
import type { Workspace } from './components/Layout/WorkspaceNav';
import { SetupView } from './components/SetupView/SetupView';
import { TestingView } from './components/TestingView/TestingView';
import { ResultsView } from './components/ResultsView/ResultsView';
import { MonthlySheetView } from './components/MonthlySheet/MonthlySheetView';
import { UsageGuideModal } from './components/Help/UsageGuideModal';
import { isSupabaseConfigured } from './lib/supabase';
import type { TestConfig } from './types';
import { formatNumber } from './utils/helpers';

export default function App() {
  const data = useOfflineData();
  const engine = useTestEngine();
  const theme = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>('test');

  const handleStart = (config: TestConfig) => {
    engine.startTest(config);
  };

  const handleNewTest = () => {
    engine.resetTest();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [engine.phase, workspace]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-teal-300"
      >
        انتقل إلى المحتوى الرئيسي
      </a>

      <div className="print:hidden">
        <AppHeader
          isOnline={data.isOnline}
          canInstall={data.canInstall}
          onInstall={() => {
            void data.installApp();
          }}
          onHelp={() => setHelpOpen(true)}
          dataStats={data.dataStats}
          theme={theme.theme}
          onToggleTheme={theme.toggleTheme}
          phase={engine.phase}
          progressPercent={engine.progressPercent}
        />
      </div>

      {!data.isOnline ? (
        <div className="border-b border-amber-200 bg-amber-50/90 print:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2 text-[11px] font-medium text-amber-800 sm:px-6 lg:px-8">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            {isSupabaseConfigured
              ? 'لا يوجد اتصال بالإنترنت — الاختبار يعمل محليًا، وتحتاج المتابعة الشهرية إلى اتصال.'
              : 'لا يوجد اتصال بالإنترنت — جميع البيانات محلية والتطبيق يعمل بكامل وظائفه.'}
          </div>
        </div>
      ) : null}

      <WorkspaceNav active={workspace} onChange={setWorkspace} />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl px-4 py-5 focus:outline-none sm:px-6 sm:py-7 lg:px-8"
      >
        <div
          key={workspace === 'monthly' ? 'monthly' : engine.phase}
          className="screen-enter"
        >
          {workspace === 'monthly' ? <MonthlySheetView /> : null}

          {workspace === 'test' && engine.phase === 'setup' ? (
            <SetupView
              surahs={data.surahs}
              juzSummaries={data.juzSummaries}
              initialConfig={null}
              onStart={handleStart}
            />
          ) : null}

          {workspace === 'test' && engine.phase === 'running' ? (
            <TestingView engine={engine} />
          ) : null}

          {workspace === 'test' && engine.phase === 'results' ? (
            <ResultsView
              summary={engine.summary}
              config={engine.config}
              onRestartSameScope={engine.restartSameScope}
              onNewTest={handleNewTest}
              onOpenMonthly={() => setWorkspace('monthly')}
            />
          ) : null}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 pt-2 sm:px-6 lg:px-8 print:hidden">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-stone-200/80 pt-4 text-[10px] text-stone-400 sm:flex-row">
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            {isSupabaseConfigured
              ? 'الاختبار يعمل محليًا، وتُحفظ المتابعة الشهرية في Supabase عند استخدامها.'
              : 'خصوصية كاملة: لا تُرسل أي بيانات، ولا تُجرى أي طلبات شبكة أثناء الاستخدام.'}
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
