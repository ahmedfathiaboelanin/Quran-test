import { CheckCircle2, Database, Download, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandMark } from '../ui/BrandMark';
import { formatNumber } from '../../utils/helpers';

interface AppHeaderProps {
  isOnline: boolean;
  canInstall: boolean;
  onInstall: () => void;
  dataStats: {
    surahs: number;
    ayaat: number;
    pages: number;
    juz: number;
  };
}

export function AppHeader({
  isOnline,
  canInstall,
  onInstall,
  dataStats,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f8f5ee]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-stone-900 sm:text-lg">
              اختبار حفظ القرآن الكريم
            </h1>
            <p className="hidden truncate text-xs text-stone-500 sm:block">
              بيانات محلية كاملة — يعمل دون اتصال بالإنترنت
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold md:inline-flex ${
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

          <span className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-stone-600 lg:inline-flex">
            <Database className="h-3.5 w-3.5" />
            {formatNumber(dataStats.ayaat)} آية محلية
          </span>

          {canInstall ? (
            <Button size="sm" variant="secondary" onClick={onInstall}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
