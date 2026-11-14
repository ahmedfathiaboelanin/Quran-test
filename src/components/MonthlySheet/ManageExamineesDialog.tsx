import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, LoaderCircle, Trash2, UserPlus, UsersRound } from 'lucide-react';
import type { Examinee, ExamineeInput, ExamineePatch } from '../../types/monthlySheet';
import { cn, formatNumber } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MonthlySheetDialog } from './MonthlySheetDialog';

interface ManageExamineesDialogProps {
  open: boolean;
  onClose: () => void;
  examinees: Examinee[];
  onAdd: (input: ExamineeInput) => Promise<Examinee>;
  onUpdate: (examineeId: string, patch: ExamineePatch) => Promise<Examinee>;
  onDelete: (examineeId: string) => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'تعذّر حفظ التغييرات.';
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

interface ExamineeEditRowProps {
  examinee: Examinee;
  onUpdate: (examineeId: string, patch: ExamineePatch) => Promise<Examinee>;
  onRequestDelete: (examinee: Examinee) => void;
  deleting: boolean;
}

function ExamineeEditRow({
  examinee,
  onUpdate,
  onRequestDelete,
  deleting,
}: ExamineeEditRowProps) {
  const nameId = useId();
  const amountId = useId();
  const [name, setName] = useState(examinee.name);
  const [amount, setAmount] = useState(String(examinee.default_amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(examinee.name);
    setAmount(String(examinee.default_amount));
  }, [examinee.default_amount, examinee.name]);

  const parsedAmount = parseAmount(amount);
  const dirty =
    name.trim() !== examinee.name ||
    (parsedAmount !== null && parsedAmount !== examinee.default_amount);

  const save = async () => {
    if (saving || !name.trim() || parsedAmount === null) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(examinee.id, {
        name: name.trim(),
        default_amount: parsedAmount,
      });
    } catch (updateError) {
      setError(errorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(examinee.id, { is_active: !examinee.is_active });
    } catch (updateError) {
      setError(errorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 transition-colors',
        examinee.is_active
          ? 'border-stone-200 bg-white'
          : 'border-stone-200/70 bg-stone-50/70',
      )}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={nameId}
            className="mb-1 block text-[10px] font-bold text-stone-500"
          >
            الاسم
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void save();
              }
            }}
            maxLength={80}
            className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="w-full sm:w-32">
          <label
            htmlFor={amountId}
            className="mb-1 block text-[10px] font-bold text-stone-500"
          >
            المبلغ الافتراضي
          </label>
          <input
            id={amountId}
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            dir="ltr"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void save();
              }
            }}
            className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-center text-sm font-bold tabular-nums text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            type="button"
            role="switch"
            aria-checked={examinee.is_active}
            onClick={() => void toggleActive()}
            disabled={saving}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition disabled:opacity-50',
              examinee.is_active
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-stone-300 bg-stone-100 text-stone-500',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                examinee.is_active ? 'bg-emerald-500' : 'bg-stone-400',
              )}
            />
            {examinee.is_active ? 'نشط' : 'موقوف'}
          </button>

          <Button
            size="sm"
            variant={dirty ? 'primary' : 'secondary'}
            onClick={() => void save()}
            disabled={saving || deleting || !dirty || !name.trim() || parsedAmount === null}
            className="shrink-0"
          >
            {saving ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            حفظ
          </Button>

          <button
            type="button"
            onClick={() => onRequestDelete(examinee)}
            disabled={saving || deleting}
            aria-label={`حذف ${examinee.name}`}
            title="حذف المختبَر نهائيًا"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50"
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ManageExamineesDialog({
  open,
  onClose,
  examinees,
  onAdd,
  onUpdate,
  onDelete,
}: ManageExamineesDialogProps) {
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('0');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Examinee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeCount = examinees.filter((examinee) => examinee.is_active).length;

  useEffect(() => {
    if (!open) return;
    setNewName('');
    setNewAmount('0');
    setError(null);
    setDeleteTarget(null);
    setDeletingId(null);
    setDeleteError(null);
  }, [open]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adding) return;

    const amount = parseAmount(newAmount);
    if (!newName.trim()) {
      setError('اسم المختبَر مطلوب.');
      return;
    }
    if (amount === null) {
      setError('المبلغ يجب أن يكون رقمًا غير سالب.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      await onAdd({ name: newName.trim(), default_amount: amount });
      setNewName('');
      setNewAmount('0');
    } catch (addError) {
      setError(errorMessage(addError));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target || deletingId) return;

    setDeletingId(target.id);
    setDeleteError(null);
    try {
      await onDelete(target.id);
    } catch (deleteFailure) {
      setDeletingId(null);
      setDeleteError(errorMessage(deleteFailure));
      return;
    }
    setDeletingId(null);
  };

  return (
    <>
      <MonthlySheetDialog
        open={open}
        onClose={onClose}
        title="إدارة المختبَرين"
        description="أضف المختبَرين وحدّث المبالغ الافتراضية أو أوقف من لا يحتاج متابعة. حذف المختبَر يزيل كل سجلاته الشهرية نهائيًا."
        icon={UsersRound}
        maxWidth="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              تم
            </Button>
          </div>
        }
      >
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-teal-200/80 bg-teal-50/60 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-700 text-white">
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">إضافة مختبَر جديد</p>
            <p className="text-[10px] text-stone-500">
              سيُضاف تلقائيًا إلى كل الشهور الحالية إذا كان نشطًا.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="new-examinee-name"
              className="mb-1 block text-[10px] font-bold text-stone-600"
            >
              الاسم
            </label>
            <input
              id="new-examinee-name"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={80}
              placeholder="مثال: ش. عمر مجدي"
              className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="w-full sm:w-32">
            <label
              htmlFor="new-examinee-amount"
              className="mb-1 block text-[10px] font-bold text-stone-600"
            >
              المبلغ
            </label>
            <input
              id="new-examinee-amount"
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

          <Button type="submit" disabled={adding || !newName.trim()} className="sm:shrink-0">
            {adding ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            إضافة
          </Button>
        </div>

        {error ? (
          <p className="mt-2 text-[11px] font-semibold text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-stone-900">قائمة المختبَرين</h3>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600">
          {formatNumber(activeCount)} نشط من {formatNumber(examinees.length)}
        </span>
      </div>

      {deleteError ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] font-semibold text-rose-700" role="alert">
          {deleteError}
        </p>
      ) : null}

      <div className="mt-2.5 space-y-2">
        {examinees.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-4 py-6 text-center text-sm text-stone-500">
            لا يوجد مختبَرون بعد. أضف أول مختبَر من النموذج أعلاه.
          </p>
        ) : (
          examinees.map((examinee) => (
            <ExamineeEditRow
              key={examinee.id}
              examinee={examinee}
              onUpdate={onUpdate}
              onRequestDelete={setDeleteTarget}
              deleting={deletingId === examinee.id}
            />
          ))
        )}
      </div>
      </MonthlySheetDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف المختبَر نهائيًا؟"
        description={
          deleteTarget
            ? `سيتم حذف «${deleteTarget.name}» وكل درجاته ومبالغه في جميع الشهور. لا يمكن التراجع عن هذه الخطوة.`
            : undefined
        }
        confirmLabel="نعم، احذف"
        cancelLabel="إلغاء"
        tone="danger"
        icon={Trash2}
      />
    </>
  );
}
