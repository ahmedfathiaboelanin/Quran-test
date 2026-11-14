import { useCallback, useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  LoaderCircle,
  Plus,
  RefreshCcw,
  User,
  UserPlus,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createExaminee, fetchExaminees } from '../../services/monthlySheetService';
import type { Examinee } from '../../types/monthlySheet';
import { formatNumber } from '../../utils/helpers';
import { Button } from '../ui/Button';

export interface ExamineeSelection {
  examineeId: string;
  studentName: string;
}

interface ExamineePickerProps {
  value: ExamineeSelection;
  onChange: (value: ExamineeSelection) => void;
  disabled?: boolean;
}

const NEW_EXAMINEE = '__new_examinee__';

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'تعذّر تحميل المختبَرين. تحقق من الاتصال وأعد المحاولة.';
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

/**
 * Picks an existing Supabase examinee or creates a new one before the test.
 * Falls back to the original free-text name field when Supabase is not set up.
 */
export function ExamineePicker({
  value,
  onChange,
  disabled = false,
}: ExamineePickerProps) {
  const ids = useId();
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('0');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const nextExaminees = await fetchExaminees({ activeOnly: true });
      setExaminees(nextExaminees);
      if (nextExaminees.length === 0) {
        setAddingNew(true);
      }
    } catch (loadFailure) {
      setLoadError(errorMessage(loadFailure));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isSupabaseConfigured) {
    return (
      <div>
        <label
          htmlFor={`${ids}-offline-name`}
          className="mb-1.5 flex items-center justify-between text-sm font-semibold text-stone-800"
        >
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-teal-700" />
            اسم المختبَر
          </span>
          <span className="text-[11px] font-normal text-stone-400">اختياري</span>
        </label>
        <input
          id={`${ids}-offline-name`}
          type="text"
          value={value.studentName}
          onChange={(event) =>
            onChange({ examineeId: '', studentName: event.target.value })
          }
          disabled={disabled}
          placeholder="أدخل اسم الطالب أو المختبَر..."
          className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
        />
      </div>
    );
  }

  const handleSelect = (rawValue: string) => {
    setAddError(null);

    if (rawValue === NEW_EXAMINEE) {
      setAddingNew(true);
      onChange({ examineeId: '', studentName: '' });
      return;
    }

    setAddingNew(false);
    const examinee = examinees.find((item) => item.id === rawValue);
    onChange({
      examineeId: examinee?.id ?? '',
      studentName: examinee?.name ?? '',
    });
  };

  const handleAdd = async () => {
    if (adding) return;

    const name = newName.trim();
    if (!name) {
      setAddError('اسم المختبَر مطلوب.');
      return;
    }

    const amount = parseAmount(newAmount);
    if (amount === null) {
      setAddError('المبلغ يجب أن يكون رقمًا غير سالب.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const created = await createExaminee({ name, default_amount: amount });
      setExaminees((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
      );
      setAddingNew(false);
      setNewName('');
      setNewAmount('0');
      onChange({ examineeId: created.id, studentName: created.name });
    } catch (createFailure) {
      setAddError(errorMessage(createFailure));
    } finally {
      setAdding(false);
    }
  };

  const selectValue = addingNew ? NEW_EXAMINEE : value.examineeId;
  const pickerDisabled = disabled || loading || loadError !== null;

  return (
    <div>
      <label
        htmlFor={`${ids}-name`}
        className="mb-1.5 flex items-center justify-between text-sm font-semibold text-stone-800"
      >
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-teal-700" />
          اسم المختبَر
        </span>
        <span className="text-[11px] font-normal text-stone-400">اختياري</span>
      </label>

      <div className="relative">
        <select
          id={`${ids}-name`}
          value={selectValue}
          onChange={(event) => handleSelect(event.target.value)}
          disabled={pickerDisabled}
          className="h-11 w-full appearance-none rounded-xl border border-stone-300 bg-white px-3.5 pe-10 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
        >
          <option value="">بدون مختبَر محدد</option>
          {examinees.map((examinee) => (
            <option key={examinee.id} value={examinee.id}>
              {examinee.name}
            </option>
          ))}
          <option value={NEW_EXAMINEE}>+ إضافة مختبَر جديد…</option>
        </select>

        {loading ? (
          <LoaderCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-600" />
        ) : (
          <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        )}
      </div>

      {loadError ? (
        <div
          className="mt-2 flex items-start justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] font-semibold leading-5 text-rose-700"
          role="alert"
        >
          <span className="flex items-start gap-1.5">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-rose-100"
          >
            <RefreshCcw className="h-3 w-3" />
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {addingNew ? (
        <div className="mt-2 rounded-2xl border border-teal-200 bg-teal-50/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-teal-900">
            <UserPlus className="h-3.5 w-3.5" />
            إضافة مختبَر جديد
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`${ids}-new-name`}
                className="mb-1 block text-[10px] font-bold text-stone-600"
              >
                الاسم
              </label>
              <input
                id={`${ids}-new-name`}
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleAdd();
                  }
                }}
                disabled={adding || pickerDisabled}
                maxLength={80}
                placeholder="مثال: ش. عمر مجدي"
                className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
              />
            </div>

            <div className="w-full sm:w-28">
              <label
                htmlFor={`${ids}-new-amount`}
                className="mb-1 block text-[10px] font-bold text-stone-600"
              >
                المبلغ
              </label>
              <input
                id={`${ids}-new-amount`}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                dir="ltr"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                disabled={adding || pickerDisabled}
                className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-center text-sm font-bold tabular-nums text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => void handleAdd()}
                disabled={adding || pickerDisabled || !newName.trim()}
              >
                {adding ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                إضافة واختيار
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAddingNew(false);
                  setAddError(null);
                }}
                disabled={adding}
              >
                إلغاء
              </Button>
            </div>
          </div>

          {addError ? (
            <p className="mt-2 text-[11px] font-semibold text-rose-700" role="alert">
              {addError}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-1.5 text-[10px] leading-5 text-stone-400">
        {value.studentName
          ? `سيُستخدم «${value.studentName}» تلقائيًا عند حفظ النتيجة في الشهرية.`
          : 'اختر مختبَرًا موجودًا أو أضف واحدًا جديدًا لمتابعة نتيجته شهريًا.'}
        {examinees.length > 0
          ? ` المتاح: ${formatNumber(examinees.length)} مختبَر نشط.`
          : ''}
      </p>
    </div>
  );
}
