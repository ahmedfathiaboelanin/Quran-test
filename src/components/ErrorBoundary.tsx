import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected application error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-[#f8f5ee] px-4">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-lg">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-stone-900">حدث خطأ غير متوقع</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            أعد تحميل الصفحة للمتابعة. جميع بيانات القرآن مضمّنة محليًا داخل
            التطبيق.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <RefreshCcw className="h-4 w-4" />
            إعادة تحميل التطبيق
          </button>
        </div>
      </div>
    );
  }
}
