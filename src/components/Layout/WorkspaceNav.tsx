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
      className="border-b border-stone-200/70 bg-[#fffdf7]/65 print:hidden"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="inline-flex rounded-xl border border-stone-200 bg-white/70 p-1 shadow-sm shadow-stone-900/[0.02]">
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
                  'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm shadow-teal-900/20'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="hidden text-[10px] font-medium text-stone-400 sm:block">
          الاختبار محلي • المتابعة الشهرية عبر Supabase
        </p>
      </div>
    </nav>
  );
}
