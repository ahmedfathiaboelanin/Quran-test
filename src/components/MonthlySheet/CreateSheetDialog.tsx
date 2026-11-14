import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarPlus, LoaderCircle, Sparkles } from 'lucide-react';
import type { MonthlySheetInput } from '../../types/monthlySheet';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { MonthlySheetDialog } from './MonthlySheetDialog';

interface CreateSheetDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: MonthlySheetInput) => Promise<unknown>;
}

function getDefaultSheetTitle(): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return 'شهر جديد';
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'تعذّر إنشاء الشهر.';
}

export function CreateSheetDialog({
  open,
  onClose,
  onCreate,
}: CreateSheetDialogProps) {
  const [title, setTitle] = useState(getDefaultSheetTitle);
  const [hasFifthWeek, setHasFifthWeek] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(getDefaultSheetTitle());
    setHasFifthWeek(false);
    setError(null);
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ title: title.trim(), has_fifth_week: hasFifthWeek });
      onClose();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MonthlySheetDialog
      open={open}
      onClose={onClose}
      title="إنشاء شهر جديد"
      description="سيُضاف كل المختبَرين النشطين تلقائيًا إلى الشهر الجديد."
      icon={CalendarPlus}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            form="create-monthly-sheet-form"
            disabled={submitting || !title.trim()}
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
            {submitting ? 'جارٍ الإنشاء…' : 'إنشاء الشهر'}
          </Button>
        </div>
      }
    >
      <form id="create-monthly-sheet-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="monthly-sheet-title"
            className="mb-1.5 block text-xs font-bold text-stone-700"
          >
            اسم الشهر
          </label>
          <input
            id="monthly-sheet-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            maxLength={80}
            placeholder="مثال: جمادى الآخرة ١٤٤٨"
            className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-stone-500">
            <Sparkles className="h-3 w-3 text-amber-500" />
            يمكنك تعديل الاسم لاحقًا إذا احتجت.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-[#f8f5ee]/70 p-4">
          <Switch
            id="has-fifth-week"
            checked={hasFifthWeek}
            onChange={setHasFifthWeek}
            label="تفعيل الأسبوع الخامس"
            description="أضف عمودًا خامسًا للأشهر التي تحتوي على خمسة أسابيع اختبار."
          />
        </div>

        {error ? (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold leading-5 text-rose-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </MonthlySheetDialog>
  );
}
