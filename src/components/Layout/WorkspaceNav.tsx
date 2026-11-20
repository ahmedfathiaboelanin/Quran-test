import { CalendarRange, ClipboardCheck } from 'lucide-react';
import { cn } from '../../utils/helpers';

export type Workspace = 'test' | 'monthly';

interface WorkspaceNavProps {
  active: Workspace;
  onChange: (workspace: Workspace) => void;
}

const tabs: Array<{
  id: Workspace;
  label: string;
  icon: typeof ClipboardCheck;
}> = [
  { id: 'test', label: 'الاختبار', icon: ClipboardCheck },
  { id: 'monthly', label: 'المتابعة الشهرية', icon: CalendarRange },
];

export function WorkspaceNav({ active, onChange }: WorkspaceNavProps) {
  return (
    <nav
      aria-label="أقسام التطبيق"
      className="border-b border-stone-300/60 bg-[#fbf7ee]/55 print:hidden"
    >
      <div className="mx-auto flex w-full max-w-7xl items-stretch justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'relative inline-flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 sm:px-4',
                  isActive
                    ? 'border-amber-500 text-teal-800'
                    : 'border-transparent text-stone-500 hover:border-stone-300 hover:bg-stone-100/50 hover:text-stone-900',
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-amber-600' : 'text-stone-400',
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* <p className="hidden items-center gap-1.5 text-[10px] font-medium text-stone-400 sm:flex">
          <span className="h-1 w-1 rounded-full bg-amber-500/70" />
          الاختبار محلي · المتابعة الشهرية عبر Supabase
        </p> */}
      </div>
    </nav>
  );
}
