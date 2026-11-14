import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface EditableNumberCellProps {
  value: number | null;
  label: string;
  mode?: 'score' | 'amount';
  allowEmpty?: boolean;
  onSave: (value: number | null) => Promise<unknown>;
}

function displayValue(value: number | null): string {
  return value === null ? '' : String(value);
}

/** A compact, accessible numeric cell that saves on blur or Enter. */
export function EditableNumberCell({
  value,
  label,
  mode = 'score',
  allowEmpty = true,
  onSave,
}: EditableNumberCellProps) {
  const [draft, setDraft] = useState(() => displayValue(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    setDraft(displayValue(value));
    setError(null);
  }, [value]);

  const commit = async () => {
    if (saving) return;
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      if (!allowEmpty) {
        setDraft(displayValue(value));
        return;
      }
      if (value === null) {
        setError(null);
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await onSave(null);
      } catch {
        setDraft(displayValue(value));
        setError('تعذّر الحفظ');
      } finally {
        setSaving(false);
      }
      return;
    }

    let parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(displayValue(value));
      setError('قيمة غير صحيحة');
      return;
    }
    parsed = mode === 'amount' ? Math.round(parsed * 100) / 100 : Math.round(parsed);

    if (parsed === value) {
      setDraft(displayValue(parsed));
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(parsed);
    } catch {
      setDraft(displayValue(value));
      setError('تعذّر الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        step={mode === 'amount' ? 0.01 : 1}
        inputMode={mode === 'amount' ? 'decimal' : 'numeric'}
        dir="ltr"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          if (error) setError(null);
        }}
        onBlur={() => {
          void commit();
        }}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelRef.current = true;
            setDraft(displayValue(value));
            event.currentTarget.blur();
          }
        }}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        title={error ?? label}
        placeholder="—"
        disabled={saving}
        className={cn(
          'h-9 w-full min-w-14 rounded-lg border bg-transparent px-1.5 text-center text-sm font-bold tabular-nums text-stone-800 transition placeholder:font-normal placeholder:text-stone-300',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60',
          error
            ? 'border-rose-300 bg-rose-50/70 focus:border-rose-400'
            : 'border-transparent hover:border-stone-300 focus:border-teal-500 focus:bg-stone-50',
        )}
      />
      {saving ? (
        <LoaderCircle className="pointer-events-none absolute left-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-teal-600" />
      ) : null}
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
