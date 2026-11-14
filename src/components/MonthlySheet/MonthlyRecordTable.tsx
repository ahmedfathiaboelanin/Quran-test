import { Info, MoveHorizontal, UserRound, UsersRound } from 'lucide-react';
import type {
  MonthlyRecordPatch,
  MonthlyRecordRow,
} from '../../types/monthlySheet';
import {
  SHEET_SLOT_LABELS,
  SHEET_SLOT_SHORT_LABELS,
  WEEK_SLOTS,
} from '../../types/monthlySheet';
import { cn, formatNumber } from '../../utils/helpers';
import {
  calculateTotalMistakes,
  getDroppedWeek,
} from '../../utils/monthlyRecords';
import { Button } from '../ui/Button';
import { EditableNumberCell } from './EditableNumberCell';

interface MonthlyRecordTableProps {
  rows: MonthlyRecordRow[];
  hasFifthWeek: boolean;
  onSaveRecord: (
    recordId: string,
    patch: MonthlyRecordPatch,
  ) => Promise<unknown>;
  onManageExaminees: () => void;
}

function initialOf(name: string): string {
  return name.trim().charAt(0) || '؟';
}

function totalTone(total: number): string {
  if (total === 0) {
    return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  }
  return 'bg-teal-50 text-teal-800 ring-teal-200';
}

export function MonthlyRecordTable({
  rows,
  hasFifthWeek,
  onSaveRecord,
  onManageExaminees,
}: MonthlyRecordTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-[#fffdf7]/70 px-5 py-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-100 text-teal-800">
          <UsersRound className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-stone-900">
          لا يوجد مختبَرون في هذا الشهر
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-stone-500">
          أضف مختبَرًا نشطًا وسيظهر صفه هنا تلقائيًا مع المبلغ الافتراضي.
        </p>
        <Button className="mt-4" onClick={onManageExaminees}>
          <UserRound className="h-4 w-4" />
          إدارة المختبَرين
        </Button>
      </div>
    );
  }

  const weekSlots = hasFifthWeek ? WEEK_SLOTS : WEEK_SLOTS.slice(0, 4);

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[#fffdf7] shadow-sm shadow-stone-900/[0.03]">
      <div className="flex items-center gap-1.5 border-b border-stone-200/70 bg-[#f8f5ee]/60 px-3 py-1.5 text-[10px] font-semibold text-stone-500 sm:hidden">
        <MoveHorizontal className="h-3.5 w-3.5 shrink-0 text-teal-600" />
        اسحب الجدول أفقيًا لعرض باقي الأسابيع
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table
          className={cn(
            'w-full table-fixed border-collapse text-right',
            hasFifthWeek ? 'min-w-[612px]' : 'min-w-[552px]',
          )}
        >
          <colgroup>
            <col className="w-[112px] sm:w-52" />
            {weekSlots.map((slot) => (
              <col key={slot} className="w-[60px] sm:w-20" />
            ))}
            <col className="w-[72px] sm:w-24" />
            <col className="w-14 sm:w-20" />
            <col className="w-[72px] sm:w-24" />
          </colgroup>
          <caption className="sr-only">
            جدول المتابعة الشهرية: الأسابيع والمراجعة الشهرية والمجموع والمبلغ
          </caption>
          <thead>
            <tr className="border-b border-stone-200 bg-[#f8f5ee] text-[10px] font-bold text-stone-600 sm:text-[11px]">
              <th
                scope="col"
                className="sticky start-0 z-20 bg-[#f8f5ee] px-2 py-2.5 text-right sm:px-4 sm:py-3"
              >
                الاسم
              </th>
              {weekSlots.map((slot) => (
                <th
                  key={slot}
                  scope="col"
                  className="px-0.5 py-2.5 text-center leading-4 sm:px-2 sm:py-3"
                >
                  <span className="sm:hidden">{SHEET_SLOT_SHORT_LABELS[slot]}</span>
                  <span className="hidden sm:inline">{SHEET_SLOT_LABELS[slot]}</span>
                </th>
              ))}
              <th
                scope="col"
                className="bg-amber-50/50 px-0.5 py-2.5 text-center leading-4 text-amber-800 sm:px-2 sm:py-3"
              >
                <span className="sm:hidden">
                  {SHEET_SLOT_SHORT_LABELS.monthly_exam}
                </span>
                <span className="hidden sm:inline">
                  {SHEET_SLOT_LABELS.monthly_exam}
                </span>
              </th>
              <th
                scope="col"
                className="px-0.5 py-2.5 text-center leading-4 sm:px-2 sm:py-3"
              >
                المجموع
              </th>
              <th
                scope="col"
                className="px-0.5 py-2.5 text-center leading-4 sm:px-3 sm:py-3"
              >
                المبلغ
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const total = calculateTotalMistakes(row);
              const dropped = getDroppedWeek(row);

              return (
                <tr
                  key={row.id}
                  className="group border-b border-stone-100 transition-colors last:border-b-0 hover:bg-stone-50/70"
                >
                  <td className="sticky start-0 z-10 bg-[#fffdf7] px-2 py-2 transition-colors group-hover:bg-stone-50 sm:px-4 sm:py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold sm:grid',
                          row.examinee.is_active
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-stone-100 text-stone-400',
                        )}
                        aria-hidden="true"
                      >
                        {initialOf(row.examinee.name)}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-xs font-bold leading-5 text-stone-900 sm:text-sm"
                          title={row.examinee.name}
                        >
                          {row.examinee.name}
                        </p>
                        {!row.examinee.is_active ? (
                          <span className="mt-0.5 inline-flex rounded-full bg-stone-100 px-1.5 py-0.5 text-[8px] font-bold text-stone-500">
                            غير نشط
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {weekSlots.map((slot) => (
                    <td key={slot} className="px-0.5 py-1.5 sm:px-1.5 sm:py-2">
                      <EditableNumberCell
                        value={row[slot]}
                        label={`${row.examinee.name} — ${SHEET_SLOT_LABELS[slot]}`}
                        onSave={(value) => onSaveRecord(row.id, { [slot]: value })}
                      />
                    </td>
                  ))}

                  <td className="bg-amber-50/40 px-0.5 py-1.5 sm:px-1.5 sm:py-2">
                    <EditableNumberCell
                      value={row.monthly_exam}
                      label={`${row.examinee.name} — ${SHEET_SLOT_LABELS.monthly_exam}`}
                      onSave={(value) =>
                        onSaveRecord(row.id, { monthly_exam: value })
                      }
                    />
                  </td>

                  <td className="px-0.5 py-1.5 text-center sm:px-2 sm:py-2">
                    <span
                      className={cn(
                        'inline-flex min-w-10 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-extrabold ring-1 tabular-nums sm:min-w-12 sm:px-2.5 sm:py-1 sm:text-sm',
                        totalTone(total),
                      )}
                      title={
                        dropped === null
                          ? 'لم يُسجَّل أي أسبوع بعد'
                          : `يُسقط أعلى أسبوع: ${formatNumber(dropped)} خطأ`
                      }
                    >
                      {formatNumber(total)}
                    </span>
                  </td>

                  <td className="px-0.5 py-1.5 sm:px-2 sm:py-2">
                    <EditableNumberCell
                      value={row.amount}
                      mode="amount"
                      allowEmpty={false}
                      label={`${row.examinee.name} — المبلغ`}
                      onSave={(value) =>
                        onSaveRecord(row.id, { amount: value ?? row.amount })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 border-t border-stone-200/80 bg-[#f8f5ee]/60 px-4 py-3 text-[11px] leading-5 text-stone-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
        <p>
          المجموع = مجموع الأسابيع المسجّلة − أعلى أسبوع + درجة المراجعة الشهرية.
          تُحفظ التعديلات تلقائيًا عند مغادرة الخانة أو الضغط على Enter.
        </p>
      </div>
    </div>
  );
}
