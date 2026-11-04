import { cn } from '../../utils/helpers';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}

export function Switch({ checked, onChange, label, description, id }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-stone-500">
            {description}
          </span>
        ) : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
          checked ? 'bg-teal-600' : 'bg-stone-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]',
            checked ? 'start-[1.375rem]' : 'start-0.5',
          )}
        />
      </button>
    </div>
  );
}
