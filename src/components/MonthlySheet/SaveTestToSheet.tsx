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
  WifiOff,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  createExaminee,
  fetchExaminees,
  fetchMonthlyRecord,
  fetchMonthlySheets,
  getCachedExaminees,
  getCachedMonthlySheets,
  saveResolvedTestScore,
} from '../../services/monthlySheetService';
import {
  enqueuePendingTestSave,
  isNetworkFailure,
} from '../../services/pendingTestSaves';
import { usePendingTestSaves } from '../../hooks/usePendingTestSaves';
import type { TestSummary } from '../../types';
import type {
  Examinee,
  MonthlyRecord,
  MonthlySheet,
  QueuedTestTarget,
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
import { useAuth } from '../../context/AuthContext';

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

export function SaveTestToSheet({
  summary,
  initialExamineeId,
  initialExamineeName,
  onOpenMonthly,
}: SaveTestToSheetProps) {
  const ids = useId();
  const { isAdmin, setLoginOpen } = useAuth();
  const pendingSaves = usePendingTestSaves();
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [sheets, setSheets] = useState<MonthlySheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usingCachedPicker, setUsingCachedPicker] = useState(false);
  const [selectedExamineeId, setSelectedExamineeId] = useState('');
  const [manualExamineeName, setManualExamineeName] = useState(
    initialExamineeName?.trim() ?? '',
  );
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
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const loadPicker = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    let nextExaminees: Examinee[] = [];
    let nextSheets: MonthlySheet[] = [];
    let fromCache = false;

    try {
      [nextExaminees, nextSheets] = await Promise.all([
        fetchExaminees({ activeOnly: true }),
        fetchMonthlySheets(),
      ]);
    } catch (loadFailure) {
      const cachedExaminees = getCachedExaminees();
      const cachedSheets = getCachedMonthlySheets();

      // Keep the save form usable even without any cached data: the examinee
      // can be typed manually and everything is resolved when the queue syncs.
      nextExaminees = cachedExaminees;
      nextSheets = cachedSheets;
      fromCache = true;
      setLoadError(
        cachedExaminees.length === 0 && cachedSheets.length === 0
          ? errorMessage(loadFailure)
          : null,
      );
    }

    setExaminees(nextExaminees);
    setSheets(nextSheets);
    setUsingCachedPicker(fromCache);
    setShowAdd(nextExaminees.length === 0 && !fromCache);
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
    setLoading(false);
  }, [initialExamineeId, initialExamineeName]);

  useEffect(() => {
    void loadPicker();
  }, [loadPicker]);

  useEffect(() => {
    const selected = examinees.find(
      (examinee) => examinee.id === selectedExamineeId,
    );
    if (selected) setManualExamineeName(selected.name);
  }, [examinees, selectedExamineeId]);

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
          setRecordError(
            isNetworkFailure(loadFailure) ? null : errorMessage(loadFailure),
          );
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
  const examineeName = selectedExaminee?.name ?? manualExamineeName.trim();
  const examineeId =
    selectedExamineeId ||
    (manualExamineeName.trim() === (initialExamineeName?.trim() ?? '')
      ? initialExamineeId ?? ''
      : '');
  const currentValue = record ? record[slot] : null;
  const canSave = Boolean(
    isAdmin &&
      (examineeId || examineeName) &&
      (selectedSheetId || usingCachedPicker) &&
      !saving &&
      !recordLoading &&
      !loading,
  );

  const buildTarget = (): QueuedTestTarget => ({
    slot,
    score: summary.totalPoints,
    ...(examineeId ? { examineeId } : {}),
    ...(examineeName ? { examineeName } : {}),
    ...(selectedSheetId ? { sheetId: selectedSheetId } : {}),
    ...(selectedSheet?.title ? { sheetTitle: selectedSheet.title } : {}),
  });

  const persist = async () => {
    if (!canSave) return;

    const target = buildTarget();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueuePendingTestSave(target);
      setToast({
        message:
          'لا يوجد اتصال — حُفظت النتيجة محليًا وستُزامن تلقائيًا عند عودة الإنترنت.',
        tone: 'success',
      });
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      const saved = await saveResolvedTestScore(target);
      setRecord(saved);
      setToast({
        message: `تم حفظ ${formatNumber(summary.totalPoints)} درجة في ${SHEET_SLOT_LABELS[slot]}.`,
        tone: 'success',
      });
    } catch (saveFailure) {
      if (isNetworkFailure(saveFailure)) {
        enqueuePendingTestSave(target);
        setToast({
          message:
            'تعذّر الوصول للشبكة — حُفظت النتيجة محليًا وستُزامن تلقائيًا عند عودة الإنترنت.',
          tone: 'success',
        });
      } else {
        setToast({ message: errorMessage(saveFailure), tone: 'error' });
      }
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

    if (!newName.trim()) {
      setAddError('اسم المختبَر مطلوب.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const created = await createExaminee({
        name: newName.trim(),
      });
      setExaminees((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
      );
      setSelectedExamineeId(created.id);
      setNewName('');
      setShowAdd(false);
      setToast({ message: 'تمت إضافة المختبَر وربطه بالشهور الحالية.', tone: 'success' });
    } catch (createFailure) {
      if (isNetworkFailure(createFailure)) {
        const name = newName.trim();
        setSelectedExamineeId('');
        setManualExamineeName(name);
        setNewName('');
        setShowAdd(false);
        setToast({
          message:
            'لا يوجد اتصال — سيُضاف المختبَر وتُحفظ النتيجة عند عودة الإنترنت.',
          tone: 'success',
        });
      } else {
        setAddError(errorMessage(createFailure));
      }
    } finally {
      setAdding(false);
    }
  };

  if (!isSupabaseConfigured) return null;

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-amber-300/60 bg-[#fbf7ee] shadow-[0_18px_40px_-34px_rgba(24,37,31,0.45)] print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-300/50 bg-gradient-to-l from-amber-50/70 via-[#fbf7ee] to-transparent px-5 py-4 dark:from-teal-950/50 dark:via-amber-950/20">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-amber-400/30 bg-teal-700 text-amber-100 shadow-sm shadow-teal-950/20">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-stone-900">
                حفظ النتيجة في الشهرية
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-stone-500">
                اربط نتيجة هذا الاختبار بالشهر والأسبوع المناسبين، وسيُحسب المجموع
                والمبلغ تلقائيًا.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingSaves > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                <WifiOff className="h-3 w-3" />
                {formatNumber(pendingSaves)} بانتظار المزامنة
              </span>
            ) : null}
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
          {usingCachedPicker ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50/70 px-3.5 py-2.5 text-[11px] leading-5 text-amber-800">
              <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                لا يوجد اتصال — يمكنك حفظ النتيجة الآن وستُزامن تلقائيًا عند
                عودة الإنترنت. اكتب اسم المختبَر إن لم تظهر القائمة.
              </p>
            </div>
          ) : null}

          {pendingSaves > 0 ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-teal-300/60 bg-teal-50/60 px-3.5 py-2.5 text-[11px] leading-5 text-teal-900">
              <CloudUpload className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
              <p>
                توجد {formatNumber(pendingSaves)} نتيجة محفوظة محليًا بانتظار
                الاتصال. ستُحفظ في قاعدة البيانات تلقائيًا بمجرد عودة الإنترنت.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-stone-500">
              <LoaderCircle className="h-4 w-4 animate-spin text-teal-600" />
              جارٍ تحميل المختبَرين والشهور…
            </div>
          ) : sheets.length === 0 && !usingCachedPicker ? (
            <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-50/50 px-4 py-6 text-center">
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
              {loadError ? (
                <div
                  className="flex items-start justify-between gap-2 rounded-lg border border-rose-300/70 bg-rose-50/70 px-3.5 py-2.5 text-[11px] leading-5 text-rose-700"
                  role="alert"
                >
                  <span className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {loadError}
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadPicker()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-semibold transition hover:bg-rose-100"
                  >
                    <RefreshCcw className="h-3 w-3" />
                    إعادة المحاولة
                  </button>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor={`${ids}-examinee`}
                      className="text-xs font-bold text-stone-700"
                    >
                      المختبَر
                    </label>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setShowAdd((current) => !current)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-teal-800 transition hover:bg-teal-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة مختبَر جديد
                      </button>
                    ) : null}
                  </div>
                  {examinees.length === 0 ? (
                    <input
                      id={`${ids}-examinee`}
                      type="text"
                      value={manualExamineeName}
                      onChange={(event) => {
                        setSelectedExamineeId('');
                        setManualExamineeName(event.target.value);
                      }}
                      maxLength={80}
                      placeholder="اسم المختبَر..."
                      className="h-11 w-full rounded-lg border border-stone-300 bg-[#fffdf8] px-3.5 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        id={`${ids}-examinee`}
                        value={selectedExamineeId}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          setSelectedExamineeId(nextId);
                          const nextExaminee = examinees.find(
                            (examinee) => examinee.id === nextId,
                          );
                          setManualExamineeName(nextExaminee?.name ?? '');
                        }}
                        className="h-11 w-full appearance-none rounded-lg border border-stone-300 bg-[#fffdf8] px-3.5 pe-9 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {examinees.map((examinee) => (
                          <option key={examinee.id} value={examinee.id}>
                            {examinee.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    </div>
                  )}
                  {examinees.length === 0 ? (
                    <p className="mt-1.5 text-[10px] leading-4 text-amber-800">
                      اكتب اسم المختبَر — سيُربط تلقائيًا عند عودة الإنترنت.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor={`${ids}-sheet`}
                    className="mb-1.5 block text-xs font-bold text-stone-700"
                  >
                    شهر المتابعة
                  </label>
                  {sheets.length === 0 ? (
                    <div className="flex h-11 items-center rounded-lg border border-dashed border-amber-400/60 bg-amber-50/60 px-3.5 text-xs font-semibold text-amber-800">
                      سيُسجَّل في أحدث شهر عند الاتصال
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id={`${ids}-sheet`}
                        value={selectedSheetId}
                        onChange={(event) => setSelectedSheetId(event.target.value)}
                        className="h-11 w-full appearance-none rounded-lg border border-stone-300 bg-[#fffdf8] px-3.5 pe-9 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  )}
                </div>
              </div>

              {showAdd ? (
                <form
                  onSubmit={handleAddExaminee}
                  className="rounded-lg border border-teal-300/60 bg-teal-50/60 p-3.5"
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
                        className="h-10 w-full rounded-lg border border-stone-300 bg-[#fffdf8] px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  هذه الخانة تحتوي حاليًا على {formatNumber(currentValue)} درجة.
                  سيُطلب تأكيد الاستبدال قبل الحفظ.
                </p>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-[#f2ecdf]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-stone-500">
                    سيُحفظ من نتيجة الاختبار
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums text-stone-900">
                    {formatNumber(summary.totalPoints)}{' '}
                    <span className="text-sm font-bold text-stone-500">درجة</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-stone-400">
                    إجمالي درجات الأخطاء المحسوبة في الاختبار (الردود الخاطئة + التنبيهات).
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  {!isAdmin ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-800">
                      <span>حفظ النتيجة متاح للمدير فقط.</span>
                      <button
                        type="button"
                        onClick={() => setLoginOpen(true)}
                        className="font-bold underline hover:text-amber-950"
                      >
                        دخول كمدير
                      </button>
                    </div>
                  ) : null}

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
          examineeName
        } من ${formatNumber(currentValue ?? 0)} إلى ${formatNumber(
          summary.totalPoints,
        )} درجة.`}
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
