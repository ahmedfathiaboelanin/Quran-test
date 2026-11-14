import { Info, UserRound, UsersRound } from 'lucide-react';
import type {
  MonthlyRecordPatch,
  MonthlyRecordRow,
} from '../../types/monthlySheet';
import { SHEET_SLOT_LABELS, WEEK_SLOTS } from '../../types/monthlySheet';
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-right">
          <caption className="sr-only">
            جدول المتابعة الشهرية: الأسابيع والمراجعة الشهرية والمجموع والمبلغ
          </caption>
          <thead>
            <tr className="border-b border-stone-200 bg-[#f8f5ee] text-[11px] font-bold text-stone-600">
              <th
                scope="col"
                className="sticky start-0 z-20 min-w-60 bg-[#f8f5ee] px-4 py-3 text-right"
              >
                الاسم
              </th>
              {weekSlots.map((slot) => (
                <th key={slot} scope="col" className="min-w-24 px-2 py-3 text-center">
                  {SHEET_SLOT_LABELS[slot]}
                </th>
              ))}
              <th
                scope="col"
                className="min-w-28 bg-amber-50/50 px-2 py-3 text-center text-amber-800"
              >
                {SHEET_SLOT_LABELS.monthly_exam}
              </th>
              <th scope="col" className="min-w-24 px-2 py-3 text-center">
                المجموع
              </th>
              <th scope="col" className="min-w-28 px-3 py-3 text-center">
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
                  <td className="sticky start-0 z-10 bg-[#fffdf7] px-4 py-2.5 transition-colors group-hover:bg-stone-50">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold',
                          row.examinee.is_active
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-stone-100 text-stone-400',
                        )}
                        aria-hidden="true"
                      >
                        {initialOf(row.examinee.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-900">
                          {row.examinee.name}
                        </p>
                        {!row.examinee.is_active ? (
                          <span className="mt-0.5 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-500">
                            غير نشط
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {weekSlots.map((slot) => (
                    <td key={slot} className="px-1.5 py-2">
                      <EditableNumberCell
                        value={row[slot]}
                        label={`${row.examinee.name} — ${SHEET_SLOT_LABELS[slot]}`}
                        onSave={(value) => onSaveRecord(row.id, { [slot]: value })}
                      />
                    </td>
                  ))}

                  <td className="bg-amber-50/40 px-1.5 py-2">
                    <EditableNumberCell
                      value={row.monthly_exam}
                      label={`${row.examinee.name} — ${SHEET_SLOT_LABELS.monthly_exam}`}
                      onSave={(value) =>
                        onSaveRecord(row.id, { monthly_exam: value })
                      }
                    />
                  </td>

                  <td className="px-2 py-2 text-center">
                    <span
                      className={cn(
                        'inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-sm font-extrabold ring-1 tabular-nums',
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

                  <td className="px-2 py-2">
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
