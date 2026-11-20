import {
  CheckCircle2,
  Database,
  Download,
  HelpCircle,
  LogIn,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  WifiOff,
} from 'lucide-react';
import type { TestPhase } from '../../types';
import { Button } from '../ui/Button';
import { BrandMark } from '../ui/BrandMark';
import { cn, formatNumber } from '../../utils/helpers';
import type { Theme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  isOnline: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onHelp: () => void;
  dataStats: {
    surahs: number;
    ayaat: number;
    pages: number;
    juz: number;
  };
  theme: Theme;
  onToggleTheme: () => void;
  phase?: TestPhase;
  progressPercent?: number;
}

const PHASE_SUBTITLES: Record<TestPhase, string> = {
  setup: 'حدّد النطاق واضبط الأسئلة ثم ابدأ التسميع',
  running: 'اختبار جارٍ — رتّب تسميعك بهدوء',
  results: 'نتيجتك وخطة المراجعة في مكان واحد',
};

export function AppHeader({
  isOnline,
  canInstall,
  onInstall,
  onHelp,
  dataStats,
  theme,
  onToggleTheme,
  phase = 'setup',
  progressPercent = 0,
}: AppHeaderProps) {
  const isDark = theme === 'dark';
  const { user, isAdmin, setLoginOpen, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300/70 bg-[#f2ecdf]/90 backdrop-blur-xl">
      <div
        className="h-[2px] bg-gradient-to-l from-transparent via-amber-500/60 to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold leading-tight text-stone-900 sm:text-[1.35rem]">
                <span className="sm:hidden">اختبار القرآن</span>
                <span className="hidden sm:inline">اختبار القرآن الكريم</span>
              </h1>
              {phase === 'running' ? (
                <span className="hidden items-center gap-1 rounded-md border border-teal-200 bg-teal-50/80 px-2 py-0.5 text-[10px] font-bold text-teal-800 sm:inline-flex dark:bg-teal-950/60 dark:text-teal-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
                  جارٍ الآن
                </span>
              ) : null}
            </div>
            <p className="hidden truncate text-[11px] leading-5 text-stone-500 sm:block">
              {PHASE_SUBTITLES[phase]}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold md:inline-flex ${
              isOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            title={`${formatNumber(dataStats.surahs)} سورة • ${formatNumber(
              dataStats.ayaat,
            )} آية • ${formatNumber(dataStats.pages)} صفحة`}
          >
            {isOnline ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                جاهز دون إنترنت
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                غير متصل — يعمل الآن
              </>
            )}
          </span>

          <span className="hidden items-center gap-1.5 rounded-md border border-stone-300/70 bg-[#fbf7ee]/70 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 lg:inline-flex">
            <Database className="h-3.5 w-3.5 text-amber-600" />
            {formatNumber(dataStats.ayaat)} آية محلية
          </span>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            aria-pressed={isDark}
            title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            className={cn(
              'group grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:h-10 sm:w-10',
              isDark
                ? 'border-amber-300/50 bg-amber-300/10 text-amber-200 shadow-sm shadow-amber-500/10 hover:border-amber-300/80 hover:bg-amber-300/20 hover:text-amber-100'
                : 'border-stone-300/70 bg-[#fbf7ee]/80 text-stone-600 hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-800',
            )}
          >
            {isDark ? (
              <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>

          <button
            type="button"
            onClick={onHelp}
            aria-label="تعليمات الاستخدام"
            title="تعليمات الاستخدام"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-stone-300/70 bg-[#fbf7ee]/80 text-stone-600 transition hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:h-10 sm:w-10"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/80 p-1 sm:gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold',
                  isAdmin
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200',
                )}
                title={isAdmin ? 'صلاحيات المدير: تعديل الجدول' : 'صلاحيات المختبَر: استعراض النتائج فقط'}
              >
                {isAdmin ? <Shield className="h-3.5 w-3.5 text-teal-700" /> : <User className="h-3.5 w-3.5 text-amber-700" />}
                <span className="hidden sm:inline">
                  {isAdmin ? 'مدير' : 'مختبَر'}:
                </span>
                <span className="max-w-28 truncate">{user.name}</span>
              </span>

              <button
                type="button"
                onClick={signOut}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setLoginOpen(true)}
              aria-label="تسجيل الدخول"
              className="border-teal-300 bg-teal-50 px-2.5 font-bold text-teal-900 hover:bg-teal-100 sm:px-3"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </Button>
          )}

          {canInstall ? (
            <Button size="sm" variant="secondary" onClick={onInstall}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </Button>
          ) : null}
        </div>
      </div>

      {phase === 'running' ? (
        <div
          className="h-0.5 w-full overflow-hidden bg-stone-200/70"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-l from-amber-500 via-teal-600 to-teal-400 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      ) : null}
    </header>
  );
}
