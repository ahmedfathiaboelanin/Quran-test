import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const ids = useId();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername('');
    setPassword('');
    setError(null);
    setShowPassword(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(username, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setUsername('admin');
    setPassword('admin');
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${ids}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl transition-all sm:p-7 dark:bg-stone-900 dark:border-stone-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-700 text-white shadow-sm shadow-teal-900/20">
            <LogIn className="h-6 w-6" />
          </span>
          <div>
            <h2 id={`${ids}-title`} className="text-xl font-bold text-stone-900 dark:text-stone-100">
              تسجيل الدخول
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              اختر دورك للوصول إلى لوحة المتابعة وتعديل السجلات أو عرضها
            </p>
          </div>
        </div>

        {error ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor={`${ids}-username`}
              className="mb-1.5 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300"
            >
              <span>اسم المستخدم</span>
              <button
                type="button"
                onClick={fillAdmin}
                className="text-[11px] font-semibold text-teal-700 hover:underline dark:text-teal-400"
              >
                تعبئة حساب المدير (admin)
              </button>
            </label>
            <div className="relative">
              <input
                id={`${ids}-username`}
                type="text"
                autoComplete="username"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin أو اسم المختبَر"
                className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 pe-10 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${ids}-password`}
              className="mb-1.5 block text-xs font-bold text-stone-700 dark:text-stone-300"
            >
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id={`${ids}-password`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 pe-10 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-3 text-xs leading-5 text-teal-900 dark:bg-teal-950/40 dark:border-teal-900/60 dark:text-teal-200">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
              <div className="space-y-1">
                <p>
                  <strong>المدير:</strong> اسم المستخدم <code className="rounded bg-teal-100 px-1 py-0.5 text-teal-900 dark:bg-teal-900 dark:text-teal-100">admin</code> وكلمة المرور <code className="rounded bg-teal-100 px-1 py-0.5 text-teal-900 dark:bg-teal-900 dark:text-teal-100">admin</code> (صلاحية تعديل الجدول وإدارة المختبَرين).
                </p>
                <p>
                  <strong>المختبَر:</strong> يدخل باسم المستخدم وكلمة المرور التي حددها المدير (صلاحية استعراض النتائج فقط دون تعديل).
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              تسجيل الدخول
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
