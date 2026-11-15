import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  KeyRound,
  LoaderCircle,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import type { Examinee, ExamineeInput, ExamineePatch } from '../../types/monthlySheet';
import { getAllAccountsMap } from '../../services/authService';
import type { UserAccount } from '../../types/auth';
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

interface ExamineeEditRowProps {
  examinee: Examinee;
  account?: UserAccount;
  onUpdate: (examineeId: string, patch: ExamineePatch) => Promise<Examinee>;
  onRequestDelete: (examinee: Examinee) => void;
  deleting: boolean;
  onAccountUpdated: () => void;
}

function ExamineeEditRow({
  examinee,
  account,
  onUpdate,
  onRequestDelete,
  deleting,
  onAccountUpdated,
}: ExamineeEditRowProps) {
  const nameId = useId();
  const [name, setName] = useState(examinee.name);
  const [username, setUsername] = useState(account?.username ?? '');
  const [password, setPassword] = useState(account?.password ?? '');
  const [showCreds, setShowCreds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(examinee.name);
  }, [examinee.name]);

  useEffect(() => {
    setUsername(account?.username ?? '');
    setPassword(account?.password ?? '');
  }, [account]);

  const nameDirty = name.trim() !== examinee.name;
  const credsDirty =
    username.trim() !== (account?.username ?? '') ||
    password.trim() !== (account?.password ?? '');
  const dirty = nameDirty || credsDirty;

  const save = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const patch: ExamineePatch = {
        name: name.trim(),
      };
      if (credsDirty) {
        patch.username = username.trim();
        patch.password = password.trim();
      }
      await onUpdate(examinee.id, patch);
      onAccountUpdated();
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
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor={nameId}
              className="block text-[10px] font-bold text-stone-500"
            >
              الاسم
            </label>
            <button
              type="button"
              onClick={() => setShowCreds((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition',
                account?.username
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              <KeyRound className="h-3 w-3" />
              {account?.username ? (
                <span>دخول: @{account.username}</span>
              ) : (
                <span>تعيين حساب دخول</span>
              )}
              {showCreds ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
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
            disabled={saving || deleting || !dirty || !name.trim()}
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

      {showCreds ? (
        <div className="mt-3 grid gap-2.5 rounded-xl border border-teal-200 bg-teal-50/50 p-2.5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-teal-900">
              اسم المستخدم (لتسجيل الدخول)
            </label>
            <input
              type="text"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: omar"
              className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-semibold text-stone-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-teal-900">
              كلمة المرور
            </label>
            <input
              type="text"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="مثال: 123456"
              className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-semibold text-stone-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      ) : null}

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
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewCreds, setShowNewCreds] = useState(false);
  const [accountsMap, setAccountsMap] = useState<Record<string, UserAccount>>({});
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Examinee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeCount = examinees.filter((examinee) => examinee.is_active).length;

  const loadAccounts = async () => {
    try {
      const map = await getAllAccountsMap();
      setAccountsMap(map);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!open) return;
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setShowNewCreds(false);
    setError(null);
    setDeleteTarget(null);
    setDeletingId(null);
    setDeleteError(null);
    void loadAccounts();
  }, [open]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adding) return;

    if (!newName.trim()) {
      setError('اسم المختبَر مطلوب.');
      return;
    }

    if (newUsername.trim() && !newPassword.trim()) {
      setError('يرجى تحديد كلمة المرور لحساب الدخول.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      await onAdd({
        name: newName.trim(),
        username: newUsername.trim() || undefined,
        password: newPassword.trim() || undefined,
      });
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setShowNewCreds(false);
      await loadAccounts();
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
      await loadAccounts();
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
        description="أضف المختبَرين وأنشئ لهم اسم مستخدم وكلمة مرور لتسجيل الدخول واستعراض النتائج، أو عدّل الأسماء وأوقف من لا يحتاج متابعة."
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
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-700 text-white">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900">إضافة مختبَر جديد</p>
                <p className="text-[10px] text-stone-500">
                  يمكنك أيضًا إنشاء اسم مستخدم وكلمة مرور له للدخول وعرض نتائجه.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNewCreds((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-300 bg-white/80 px-2 py-1 text-[11px] font-bold text-teal-800 transition hover:bg-teal-100/70"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {showNewCreds ? 'إخفاء بيانات الدخول' : 'تحديد اسم وكلمة مرور'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="new-examinee-name"
                className="mb-1 block text-[10px] font-bold text-stone-600"
              >
                اسم المختبَر
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

            {showNewCreds ? (
              <div className="grid gap-3 rounded-xl border border-teal-200 bg-white/70 p-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-examinee-username"
                    className="mb-1 block text-[10px] font-bold text-stone-600"
                  >
                    اسم المستخدم (Sign In Username)
                  </label>
                  <input
                    id="new-examinee-username"
                    type="text"
                    dir="ltr"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="مثال: omar"
                    className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-examinee-password"
                    className="mb-1 block text-[10px] font-bold text-stone-600"
                  >
                    كلمة المرور (Password)
                  </label>
                  <input
                    id="new-examinee-password"
                    type="text"
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="مثال: 123456"
                    className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={adding || !newName.trim()}>
                {adding ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                إضافة المختبَر
              </Button>
            </div>
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
                account={accountsMap[examinee.id]}
                onUpdate={onUpdate}
                onRequestDelete={setDeleteTarget}
                deleting={deletingId === examinee.id}
                onAccountUpdated={loadAccounts}
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
            ? `سيتم حذف «${deleteTarget.name}» وكل درجاته ومبالغه المحسوبة في جميع الشهور وحساب دخوله إن وُجد. لا يمكن التراجع عن هذه الخطوة.`
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
