import {
  AlertCircle,
  BookOpen,
  CheckCheck,
  Clock,
  ListChecks,
  Play,
  SlidersHorizontal,
} from 'lucide-react';

const STEPS = [
  {
    title: 'اختر النطاق',
    description:
      'حدّد سورًا أو صفحات أو أجزاء أو نطاقًا مخصصًا، ويمكنك الجمع بين أكثر من نطاق.',
    icon: BookOpen,
  },
  {
    title: 'اضبط الاختبار',
    description:
      'اختر عدد الأسئلة وطريقة التوزيع، وحدد عرض آية واحدة أو الصفحة كاملة، وفعّل الترتيب العشوائي أو الوضع الأعمى إن أردت.',
    icon: SlidersHorizontal,
  },
  {
    title: 'ابدأ التسميع',
    description:
      'اقرأ الآية أو الصفحة كاملة، وتنقّل بين الآيات أو الصفحات، وأظهر النص أو أخفه أثناء التسميع. وفي وضع الصفحة كاملة تبقى أزرار الصفحة السابقة والتالية وعداد الأسئلة ظاهرة في شريط التقييم السفلي على الهاتف.',
    icon: Play,
  },
  {
    title: 'قيّم بالدرجات',
    description:
      'سجّل الترددات والردود الخاطئة والتنبيهات من شريط التقييم السفلي على الهاتف: الرد = درجة، والتنبيه = نصف درجة، والتردد = ربع درجة.',
    icon: CheckCheck,
  },
  {
    title: 'راجع النتائج',
    description:
      'شاهد إجمالي الدرجات، وتفصيل الأخطاء، والسور التي تحتاج إلى مراجعة، وملاحظات المختبر لكل سؤال.',
    icon: ListChecks,
  },
];

export function UsageGuide() {
  return (
    <section className="rounded-3xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-amber-50/40 p-4 shadow-sm shadow-stone-900/[0.02] sm:p-5">
      <div className="flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-700 text-white">
          <BookOpen className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-stone-900">طريقة الاستخدام في ٥ خطوات</h2>
          <p className="mt-0.5 text-xs leading-5 text-stone-500">
            من اختيار النطاق حتى مراجعة النتائج — كل شيء واضح وبسيط.
          </p>
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="rounded-xl border border-white bg-white/80 p-3 shadow-sm shadow-stone-900/[0.02]"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                  {index + 1}
                </span>
                <Icon className="h-3.5 w-3.5 text-teal-600" />
                <p className="text-xs font-bold text-stone-800">{step.title}</p>
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/80 p-3 text-[10px] leading-5 ring-1 ring-teal-100">
        <span className="font-bold text-stone-700">حساب الدرجة:</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
          <Clock className="h-3 w-3" />
          تردد = ربع درجة
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-800">
          <AlertCircle className="h-3 w-3" />
          رد خاطئ = درجة
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-800">
          <AlertCircle className="h-3 w-3" />
          تنبيه = نصف درجة
        </span>
        <span className="text-stone-500">
          النتيجة هي مجموع الأخطاء وليست مكافأة على الإجابات الصحيحة — الأقل أفضل،
          والتقييم بيد المختبر.
        </span>
      </div>
    </section>
  );
}
