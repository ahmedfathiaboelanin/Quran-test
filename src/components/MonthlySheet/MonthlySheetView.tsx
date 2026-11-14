import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  CalendarRange,
  Database,
  LoaderCircle,
  RefreshCcw,
  TriangleAlert,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMonthlyData } from '../../hooks/useMonthlyData';
import type {
  Examinee,
  ExamineeInput,
  ExamineePatch,
  MonthlyRecordPatch,
  MonthlySheet,
  MonthlySheetInput,
} from '../../types/monthlySheet';
import { calculateTotalMistakes } from '../../utils/monthlyRecords';
import { cn, formatNumber } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { CreateSheetDialog } from './CreateSheetDialog';
import { ManageExamineesDialog } from './ManageExamineesDialog';
import { MonthlyRecordTable } from './MonthlyRecordTable';

type ToastState = {
  message: string;
  tone: 'success' | 'error';
} | null;

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'تعذّر حفظ التعديل. تحقق من الاتصال وأعد المحاولة.';
}

function HeaderStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-100/80">
        <Icon className="h-3.5 w-3.5 text-amber-300" />
        {label}
      </span>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums text-white">{value}</p>
    </div>
  );
}

function SetupNotice() {
  return (
    <section className="rounded-3xl border border-amber-200/80 bg-[#fffdf7] p-5 shadow-sm shadow-stone-900/[0.03] sm:p-7">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">
        <Database className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-stone-900">
        اربط المتابعة الشهرية بـ Supabase
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-7 text-stone-600">
        الاختبار وبيانات القرآن تعمل محليًا كما هي. أما حفظ المختبَرين والدرجات
        والمبالغ فيحتاج مشروع Supabase واحدًا ثم متغيرين في بيئة التطبيق.
      </p>

      <ol className="mt-5 space-y-4">
        <li className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">
            ١
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900">طبّق ملف الترحيل</p>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              نفّذ محتوى الملف عبر Supabase CLI أو محرر SQL:
            </p>
            <code
              dir="ltr"
              className="mt-1.5 block overflow-x-auto rounded-xl border border-stone-200 bg-[#f8f5ee] px-3 py-2 text-left text-[11px] font-semibold text-teal-900"
            >
              supabase/migrations/20261114000000_monthly_tracking.sql
            </code>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">
            ٢
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900">
              أضف مفاتيح المشروع إلى <span dir="ltr">.env.local</span>
            </p>
            <pre
              dir="ltr"
              className="mt-1.5 overflow-x-auto rounded-xl border border-stone-200 bg-[#f8f5ee] px-3 py-2 text-left text-[11px] leading-6 text-stone-700"
            >
              <code>{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY`}</code>
            </pre>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">
            ٣
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900">
              فعّل Anonymous Sign-ins
            </p>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              من Supabase Dashboard ← Authentication ← Providers ← Anonymous.
              يستخدم التطبيق جلسة مجهولة تلقائيًا حتى لا تظهر شاشة تسجيل دخول، مع
              بقاء سياسات RLS مفعّلة على الجداول.
            </p>
          </div>
        </li>
      </ol>

      <p className="mt-5 rounded-2xl border border-teal-200/70 bg-teal-50/60 px-4 py-3 text-xs leading-6 text-teal-900">
        بعد الحفظ في <span dir="ltr">.env.local</span> أعد تشغيل خادم التطوير. يبقى
        الاختبار قابلًا للعمل دون إنترنت، لكن فتح المتابعة الشهرية وحفظ النتائج
        يحتاج اتصالًا بـ Supabase.
      </p>
    </section>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[#fffdf7]">
      <div className="flex items-center gap-2 border-b border-stone-200 bg-[#f8f5ee] px-4 py-3 text-xs font-semibold text-stone-500">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-teal-600" />
        جارٍ تحميل سجلات الشهر…
      </div>
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-xl bg-stone-100"
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function MonthlySheetView() {
  const data = useMonthlyData();
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [fifthUpdating, setFifthUpdating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const activeExaminees = data.examinees.filter(
    (examinee) => examinee.is_active,
  ).length;
  const totalAmount = useMemo(
    () => data.rows.reduce((sum, row) => sum + row.amount, 0),
    [data.rows],
  );
  const totalMistakes = useMemo(
    () =>
      data.rows.reduce(
        (sum, row) => sum + calculateTotalMistakes(row),
        0,
      ),
    [data.rows],
  );

  const handleCreateSheet = async (input: MonthlySheetInput) => {
    const sheet = await data.addSheet(input);
    setToast({
      message: `تم إنشاء «${sheet.title}» وإضافة المختبَرين النشطين.`,
      tone: 'success',
    });
    return sheet;
  };

  const handleAddExaminee = async (input: ExamineeInput): Promise<Examinee> => {
    const examinee = await data.addExaminee(input);
    setToast({ message: `تمت إضافة ${examinee.name}.`, tone: 'success' });
    return examinee;
  };

  const handleUpdateExaminee = async (
    examineeId: string,
    patch: ExamineePatch,
  ): Promise<Examinee> => {
    const examinee = await data.editExaminee(examineeId, patch);
    setToast({ message: 'تم تحديث بيانات المختبَر.', tone: 'success' });
    return examinee;
  };

  const handleDeleteExaminee = async (examineeId: string) => {
    await data.removeExaminee(examineeId);
    setToast({ message: 'تم حذف المختبَر وسجلاته الشهرية.', tone: 'success' });
  };

  const handleSaveRecord = async (
    recordId: string,
    patch: MonthlyRecordPatch,
  ) => {
    try {
      await data.saveRecord(recordId, patch);
    } catch (error) {
      // The cell restores its previous value; the toast gives immediate feedback.
      setToast({ message: errorMessage(error), tone: 'error' });
    }
  };

  const toggleFifthWeek = async () => {
    if (!data.selectedSheet || fifthUpdating) return;

    const nextValue = !data.selectedSheet.has_fifth_week;
    setFifthUpdating(true);
    try {
      await data.editSheet(data.selectedSheet.id, {
        has_fifth_week: nextValue,
      });
      setToast({
        message: nextValue
          ? 'تم تفعيل عمود الأسبوع الخامس.'
          : 'تم إخفاء عمود الأسبوع الخامس.',
        tone: 'success',
      });
    } catch (error) {
      setToast({ message: errorMessage(error), tone: 'error' });
    } finally {
      setFifthUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-900 p-5 text-white shadow-xl shadow-teal-950/15 sm:p-7">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_10%_10%,#fef3c7_0,transparent_28%),radial-gradient(circle_at_90%_90%,#5eead4_0,transparent_30%)]" />

        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100 ring-1 ring-white/15">
                <CalendarRange className="h-3.5 w-3.5 text-amber-300" />
                المتابعة الشهرية
              </span>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">دفتر الشهرية</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-teal-100/80 sm:text-sm">
                سجّل أخطاء الأسابيع والمراجعة الشهرية، وتابع المبالغ. يُسقط النظام
                أعلى أسبوع تلقائيًا عند حساب المجموع.
              </p>
            </div>

            {data.configured ? (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => setManageOpen(true)}
                  disabled={data.loading}
                  className="border-white/25 bg-white/15 text-white hover:border-white/40 hover:bg-white/25 hover:text-white"
                >
                  <UsersRound className="h-4 w-4" />
                  إدارة المختبَرين
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={data.loading}
                  className="border border-amber-300/60 bg-amber-300 font-bold text-amber-950 shadow-sm shadow-amber-950/20 hover:bg-amber-200"
                >
                  <CalendarPlus className="h-4 w-4" />
                  شهر جديد
                </Button>
              </div>
            ) : null}
          </div>

          {data.configured ? (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:max-w-2xl sm:grid-cols-3">
              <HeaderStat
                icon={UsersRound}
                label="مختبَرون نشطون"
                value={formatNumber(activeExaminees)}
              />
              <HeaderStat
                icon={Wallet}
                label="إجمالي المبالغ"
                value={formatNumber(totalAmount)}
              />
              <HeaderStat
                icon={TriangleAlert}
                label="مجموع أخطاء الشهر"
                value={formatNumber(totalMistakes)}
              />
            </div>
          ) : null}
        </div>
      </section>

      {!data.configured ? <SetupNotice /> : null}

      {data.configured && data.error ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-800">
                تعذّر إكمال العملية
              </p>
              <p className="mt-0.5 break-words text-xs leading-5 text-rose-700">
                {data.error}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void data.refresh()}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              إعادة المحاولة
            </Button>
            <Button size="sm" variant="ghost" onClick={data.clearError}>
              إخفاء
            </Button>
          </div>
        </div>
      ) : null}

      {data.configured ? (
        data.loading ? (
          <TableSkeleton />
        ) : data.sheets.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-teal-300 bg-[#fffdf7] px-5 py-12 text-center shadow-sm shadow-stone-900/[0.02]">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-100 text-teal-800">
              <CalendarPlus className="h-8 w-8" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-stone-900">
              ابدأ أول شهر متابعة
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-stone-500">
              أنشئ شهرًا مثل «جمادى الآخرة ١٤٤٨»، وسيُضاف كل المختبَرين النشطين
              تلقائيًا مع مبالغهم الافتراضية.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <CalendarPlus className="h-4 w-4" />
                إنشاء شهر جديد
              </Button>
              <Button variant="secondary" onClick={() => setManageOpen(true)}>
                <UsersRound className="h-4 w-4" />
                إدارة المختبَرين
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-stone-200/90 bg-[#fffdf7] p-4 shadow-sm shadow-stone-900/[0.03]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <label
                    htmlFor="monthly-sheet-selector"
                    className="shrink-0 text-xs font-bold text-stone-700"
                  >
                    الشهر المعروض
                  </label>
                  <select
                    id="monthly-sheet-selector"
                    value={data.selectedSheetId ?? ''}
                    onChange={(event) => data.selectSheet(event.target.value)}
                    className="h-10 min-w-0 rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:min-w-64"
                  >
                    {data.sheets.map((sheet: MonthlySheet) => (
                      <option key={sheet.id} value={sheet.id}>
                        {sheet.title}
                      </option>
                    ))}
                  </select>
                </div>

                {data.selectedSheet ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={data.selectedSheet.has_fifth_week}
                    aria-label="تفعيل الأسبوع الخامس لهذا الشهر"
                    onClick={() => void toggleFifthWeek()}
                    disabled={fifthUpdating}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-2 self-start rounded-xl border px-3 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60 lg:self-auto',
                      data.selectedSheet.has_fifth_week
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-stone-300 bg-white text-stone-500 hover:bg-stone-50',
                    )}
                  >
                    <span
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        data.selectedSheet.has_fifth_week
                          ? 'bg-amber-500'
                          : 'bg-stone-300',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[inset-inline-start]',
                          data.selectedSheet.has_fifth_week
                            ? 'start-[1.125rem]'
                            : 'start-0.5',
                        )}
                      />
                    </span>
                    الأسبوع الخامس
                    {fifthUpdating ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                  </button>
                ) : null}
              </div>

              <p className="mt-2 text-[10px] leading-5 text-stone-400">
                انقر أي خانة لتعديل الدرجة أو المبلغ، ثم اضغط Enter أو غادر الخانة
                للحفظ. يتحدّث المجموع مباشرة.
              </p>
            </section>

            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {data.selectedSheet?.title ?? 'سجل الشهر'}
                </h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatNumber(data.rows.length)} صفًا •{' '}
                  {data.selectedSheet?.has_fifth_week
                    ? 'خمسة أسابيع مفعّلة'
                    : 'أربعة أسابيع'}
                </p>
              </div>
              {data.rowsLoading && data.rows.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400">
                  <LoaderCircle className="h-3 w-3 animate-spin" />
                  تحديث السجلات…
                </span>
              ) : null}
            </div>

            {data.rowsLoading && data.rows.length === 0 ? (
              <TableSkeleton />
            ) : (
              <MonthlyRecordTable
                rows={data.rows}
                hasFifthWeek={Boolean(data.selectedSheet?.has_fifth_week)}
                onSaveRecord={handleSaveRecord}
                onManageExaminees={() => setManageOpen(true)}
              />
            )}
          </>
        )
      ) : null}

      <CreateSheetDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateSheet}
      />

      <ManageExamineesDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        examinees={data.examinees}
        onAdd={handleAddExaminee}
        onUpdate={handleUpdateExaminee}
        onDelete={handleDeleteExaminee}
      />

      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={closeToast}
          duration={2600}
        />
      ) : null}
    </div>
  );
}
