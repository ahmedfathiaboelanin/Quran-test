import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  CalendarRange,
  Check,
  ChevronDown,
  CloudUpload,
  LoaderCircle,
  Plus,
  RefreshCcw,
  UserPlus,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  createExaminee,
  fetchExaminees,
  fetchMonthlyRecord,
  fetchMonthlySheets,
  saveTestMistakes,
} from '../../services/monthlySheetService';
import type { TestSummary } from '../../types';
import type {
  Examinee,
  MonthlyRecord,
  MonthlySheet,
  SheetSlot,
} from '../../types/monthlySheet';
import {
  SHEET_SLOTS,
  SHEET_SLOT_LABELS,
} from '../../types/monthlySheet';
import { cn, formatNumber } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';

interface SaveTestToSheetProps {
  summary: TestSummary;
  initialExamineeId?: string;
  initialExamineeName?: string;
  onOpenMonthly?: () => void;
}

type ToastState = {
  message: string;
  tone: 'success' | 'error';
} | null;

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'تعذّر الاتصال بقاعدة البيانات.';
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function SaveTestToSheet({
  summary,
  initialExamineeId,
  initialExamineeName,
  onOpenMonthly,
}: SaveTestToSheetProps) {
  const ids = useId();
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [sheets, setSheets] = useState<MonthlySheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedExamineeId, setSelectedExamineeId] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [slot, setSlot] = useState<SheetSlot>('week_1');
  const [record, setRecord] = useState<MonthlyRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordVersion, setRecordVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('0');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const loadPicker = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextExaminees, nextSheets] = await Promise.all([
        fetchExaminees({ activeOnly: true }),
        fetchMonthlySheets(),
      ]);

      setExaminees(nextExaminees);
      setSheets(nextSheets);
      setShowAdd(nextExaminees.length === 0);
      setSelectedExamineeId((current) => {
        if (current && nextExaminees.some((examinee) => examinee.id === current)) {
          return current;
        }
        const requestedName = initialExamineeName?.trim();
        const matched =
          (initialExamineeId
            ? nextExaminees.find((examinee) => examinee.id === initialExamineeId)
            : null) ??
          (requestedName
            ? nextExaminees.find((examinee) => examinee.name.trim() === requestedName)
            : null);
        return matched?.id ?? nextExaminees[0]?.id ?? '';
      });
      setSelectedSheetId((current) => {
        if (current && nextSheets.some((sheet) => sheet.id === current)) {
          return current;
        }
        return nextSheets[0]?.id ?? '';
      });
    } catch (loadFailure) {
      setLoadError(errorMessage(loadFailure));
    } finally {
      setLoading(false);
    }
  }, [initialExamineeId, initialExamineeName]);

  useEffect(() => {
    void loadPicker();
  }, [loadPicker]);

  const selectedSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === selectedSheetId) ?? null,
    [selectedSheetId, sheets],
  );

  const availableSlots = useMemo(
    () =>
      SHEET_SLOTS.filter(
        (candidate) => candidate !== 'week_5' || selectedSheet?.has_fifth_week,
      ),
    [selectedSheet?.has_fifth_week],
  );

  useEffect(() => {
    if (slot === 'week_5' && !selectedSheet?.has_fifth_week) {
      setSlot('week_1');
    }
  }, [selectedSheet?.has_fifth_week, slot]);

  useEffect(() => {
    if (!selectedExamineeId || !selectedSheetId) {
      setRecord(null);
      return;
    }

    let cancelled = false;
    setRecord(null);
    setRecordLoading(true);
    setRecordError(null);
    fetchMonthlyRecord(selectedSheetId, selectedExamineeId)
      .then((nextRecord) => {
        if (!cancelled) setRecord(nextRecord);
      })
      .catch((loadFailure: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setRecordError(errorMessage(loadFailure));
        }
      })
      .finally(() => {
        if (!cancelled) setRecordLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordVersion, selectedExamineeId, selectedSheetId]);

  const selectedExaminee =
    examinees.find((examinee) => examinee.id === selectedExamineeId) ?? null;
  const currentValue = record ? record[slot] : null;
  const canSave = Boolean(
    selectedExamineeId &&
      selectedSheetId &&
      !saving &&
      !recordLoading &&
      !loading,
  );

  const persist = async () => {
    if (!canSave) return;

    setSaving(true);
    setToast(null);
    try {
      const saved = await saveTestMistakes({
        sheetId: selectedSheetId,
        examineeId: selectedExamineeId,
        slot,
        mistakes: summary.totalMistakes,
      });
      setRecord(saved);
      setToast({
        message: `تم حفظ ${formatNumber(summary.totalMistakes)} خطأ في ${SHEET_SLOT_LABELS[slot]}.`,
        tone: 'success',
      });
    } catch (saveFailure) {
      setToast({ message: errorMessage(saveFailure), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    if (!canSave) return;
    if (currentValue !== null) {
      setConfirmOpen(true);
      return;
    }
    void persist();
  };

  const handleAddExaminee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adding) return;

    const amount = parseAmount(newAmount);
    if (!newName.trim()) {
      setAddError('اسم المختبَر مطلوب.');
      return;
    }
    if (amount === null) {
      setAddError('المبلغ يجب أن يكون رقمًا غير سالب.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const created = await createExaminee({
        name: newName.trim(),
        default_amount: amount,
      });
      setExaminees((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
      );
      setSelectedExamineeId(created.id);
      setNewName('');
      setNewAmount('0');
      setShowAdd(false);
      setToast({ message: 'تمت إضافة المختبَر وربطه بالشهور الحالية.', tone: 'success' });
    } catch (createFailure) {
      setAddError(errorMessage(createFailure));
    } finally {
      setAdding(false);
    }
  };

  if (!isSupabaseConfigured) return null;

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-teal-200/80 bg-[#fffdf7] shadow-sm shadow-stone-900/[0.03] print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-200/70 bg-gradient-to-l from-teal-50/80 via-amber-50/30 to-transparent px-5 py-4 dark:from-teal-950/50 dark:via-amber-950/20">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-700 text-white shadow-sm shadow-teal-900/20">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-stone-900">
                حفظ النتيجة في الشهرية
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-stone-500">
                اربط نتيجة هذا الاختبار بالشهر والأسبوع المناسبين، وسيُحسب المجموع
                تلقائيًا.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-teal-800">
              <CloudUpload className="h-3 w-3" />
              Supabase
            </span>
            {onOpenMonthly ? (
              <button
                type="button"
                onClick={onOpenMonthly}
                className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-teal-800 transition hover:bg-teal-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                فتح المتابعة
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-stone-500">
              <LoaderCircle className="h-4 w-4 animate-spin text-teal-600" />
              جارٍ تحميل المختبَرين والشهور…
            </div>
          ) : loadError ? (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-rose-800">
                    تعذّر تحميل بيانات المتابعة
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-rose-700">{loadError}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void loadPicker()}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : sheets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-6 text-center">
              <p className="text-sm font-bold text-stone-900">
                لا يوجد شهر متابعة بعد
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-stone-500">
                أنشئ شهرًا من لوحة المتابعة الشهرية، ثم ستتمكن من حفظ نتيجة هذا
                الاختبار فيه.
              </p>
              {onOpenMonthly ? (
                <Button className="mt-3" size="sm" onClick={onOpenMonthly}>
                  <CalendarRange className="h-4 w-4" />
                  إنشاء شهر متابعة
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor={`${ids}-examinee`}
                      className="text-xs font-bold text-stone-700"
                    >
                      المختبَر
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdd((current) => !current)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-teal-800 transition hover:bg-teal-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة مختبَر جديد
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      id={`${ids}-examinee`}
                      value={selectedExamineeId}
                      onChange={(event) => setSelectedExamineeId(event.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-stone-300 bg-white px-3.5 pe-9 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {examinees.length === 0 ? (
                        <option value="">لا يوجد مختبَرون نشطون</option>
                      ) : null}
                      {examinees.map((examinee) => (
                        <option key={examinee.id} value={examinee.id}>
                          {examinee.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`${ids}-sheet`}
                    className="mb-1.5 block text-xs font-bold text-stone-700"
                  >
                    شهر المتابعة
                  </label>
                  <div className="relative">
                    <select
                      id={`${ids}-sheet`}
                      value={selectedSheetId}
                      onChange={(event) => setSelectedSheetId(event.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-stone-300 bg-white px-3.5 pe-9 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {sheets.map((sheet) => (
                        <option key={sheet.id} value={sheet.id}>
                          {sheet.title}
                          {sheet.has_fifth_week ? ' — ٥ أسابيع' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>
              </div>

              {showAdd ? (
                <form
                  onSubmit={handleAddExaminee}
                  className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3.5"
                >
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <UserPlus className="h-4 w-4" />
                    مختبَر جديد
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                        placeholder="مثال: ش. عمر مجدي"
                        maxLength={80}
                        className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="w-full sm:w-32">
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
                        className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-center text-sm font-bold tabular-nums text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={adding || !newName.trim()}
                      >
                        {adding ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        إضافة
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowAdd(false);
                          setAddError(null);
                        }}
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
                </form>
              ) : null}

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-700">
                    خانة الاختبار
                  </span>
                  {recordLoading ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400">
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                      تحميل القيم الحالية…
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableSlots.map((candidate) => {
                    const savedValue = record?.[candidate] ?? null;
                    const isSelected = slot === candidate;

                    return (
                      <button
                        key={candidate}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSlot(candidate)}
                        className={cn(
                          'rounded-xl border p-2.5 text-right transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                          isSelected
                            ? 'border-teal-600 bg-teal-50 shadow-sm ring-1 ring-teal-600/20'
                            : 'border-stone-200 bg-white hover:border-teal-300 hover:bg-teal-50/30',
                        )}
                      >
                        <span
                          className={cn(
                            'block text-[11px] font-bold',
                            isSelected ? 'text-teal-900' : 'text-stone-700',
                          )}
                        >
                          {SHEET_SLOT_LABELS[candidate]}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-stone-400">
                          {savedValue === null
                            ? 'فارغ'
                            : `المسجّل: ${formatNumber(savedValue)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {recordError ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  <span>{recordError}</span>
                  <button
                    type="button"
                    onClick={() => setRecordVersion((version) => version + 1)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-amber-100"
                  >
                    <RefreshCcw className="h-3 w-3" />
                    إعادة المحاولة
                  </button>
                </div>
              ) : currentValue !== null ? (
                <p className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] leading-5 text-amber-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  هذه الخانة تحتوي حاليًا على {formatNumber(currentValue)} خطأ.
                  سيُطلب تأكيد الاستبدال قبل الحفظ.
                </p>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-[#f8f5ee]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-stone-500">
                    سيُحفظ من نتيجة الاختبار
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums text-stone-900">
                    {formatNumber(summary.totalMistakes)}{' '}
                    <span className="text-sm font-bold text-stone-500">خطأ</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-stone-400">
                    الردود الخاطئة + التنبيهات. الترددات تُحسب بالدرجات في النتيجة
                    ولا تُضاف إلى خانة الأخطاء.
                  </p>
                </div>

                <Button
                  onClick={requestSave}
                  disabled={!canSave}
                  className="sm:min-w-44"
                >
                  {saving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {saving
                    ? 'جارٍ الحفظ…'
                    : `حفظ في ${SHEET_SLOT_LABELS[slot]}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void persist()}
        title="استبدال القيمة الحالية؟"
        description={`ستُستبدل درجة ${SHEET_SLOT_LABELS[slot]} للمختبَر ${
          selectedExaminee?.name ?? ''
        } من ${formatNumber(currentValue ?? 0)} إلى ${formatNumber(
          summary.totalMistakes,
        )} خطأ.`}
        confirmLabel="نعم، احفظ الجديد"
        cancelLabel="إلغاء"
        tone="warning"
        icon={CalendarCheck2}
      />

      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={closeToast}
          duration={toast.tone === 'error' ? 4200 : 2600}
        />
      ) : null}
    </>
  );
}
