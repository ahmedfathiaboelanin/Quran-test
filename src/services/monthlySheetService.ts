import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import type {
  Examinee,
  ExamineeInput,
  ExamineePatch,
  MonthlyRecord,
  MonthlyRecordPatch,
  MonthlyRecordRow,
  MonthlySheet,
  MonthlySheetInput,
  SaveTestTarget,
  SheetSlot,
} from '../types/monthlySheet';
import { SHEET_SLOTS, WEEK_SLOTS } from '../types/monthlySheet';
import { calculateTotalMistakes } from '../utils/monthlyRecords';

export class MonthlySheetServiceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MonthlySheetServiceError';
    this.cause = cause;
  }
}

type DbRow = Record<string, unknown>;

function asNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapExaminee(row: DbRow): Examinee {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    default_amount: asNumber(row.default_amount),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at ?? ''),
  };
}

function mapMonthlySheet(row: DbRow): MonthlySheet {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    has_fifth_week: Boolean(row.has_fifth_week),
    created_at: String(row.created_at ?? ''),
  };
}

function mapMonthlyRecord(row: DbRow): MonthlyRecord {
  const record: MonthlyRecord = {
    id: String(row.id),
    sheet_id: String(row.sheet_id),
    examinee_id: String(row.examinee_id),
    week_1: asNullableNumber(row.week_1),
    week_2: asNullableNumber(row.week_2),
    week_3: asNullableNumber(row.week_3),
    week_4: asNullableNumber(row.week_4),
    week_5: asNullableNumber(row.week_5),
    monthly_exam: asNullableNumber(row.monthly_exam),
    amount: asNumber(row.amount),
    total_mistakes: asNumber(row.total_mistakes),
    updated_at: String(row.updated_at ?? ''),
  };

  return {
    ...record,
    total_mistakes: calculateTotalMistakes(record),
  };
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new MonthlySheetServiceError('الاسم مطلوب.');
  }
  return trimmed;
}

function normalizeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new MonthlySheetServiceError('المبلغ يجب أن يكون رقمًا غير سالب.');
  }
  return Math.round(amount * 100) / 100;
}

function normalizeScore(value: number | null, label: string): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new MonthlySheetServiceError(`${label} يجب أن يكون رقمًا غير سالب.`);
  }
  return Math.round(value);
}

function ensureSlot(slot: SheetSlot): SheetSlot {
  if (!SHEET_SLOTS.includes(slot)) {
    throw new MonthlySheetServiceError('خانة الاختبار غير معروفة.');
  }
  return slot;
}

function raise(message: string, cause: unknown): never {
  throw new MonthlySheetServiceError(message, cause);
}

async function fetchAllExaminees(client: SupabaseClient): Promise<Examinee[]> {
  const { data, error } = await client
    .from('examinees')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) raise('تعذّر تحميل المختبَرين.', error);
  return ((data ?? []) as DbRow[]).map(mapExaminee);
}

async function addExamineeToAllSheets(
  client: SupabaseClient,
  examineeId: string,
  defaultAmount: number,
): Promise<void> {
  const { data: sheets, error } = await client.from('monthly_sheets').select('id');
  if (error) raise('تعذّر تجهيز صفوف الشهور الجديدة.', error);

  const sheetIds = ((sheets ?? []) as Array<{ id: string }>).map((sheet) => sheet.id);
  if (sheetIds.length === 0) return;

  const { error: insertError } = await client.from('monthly_records').upsert(
    sheetIds.map((sheetId) => ({
      sheet_id: sheetId,
      examinee_id: examineeId,
      amount: defaultAmount,
    })),
    { onConflict: 'sheet_id,examinee_id', ignoreDuplicates: true },
  );

  if (insertError) raise('تعذّر إضافة المختبَر إلى الشهور الحالية.', insertError);
}

// ---------------------------------------------------------------------------
// Examinees
// ---------------------------------------------------------------------------

export async function fetchExaminees(options: { activeOnly?: boolean } = {}): Promise<
  Examinee[]
> {
  const client = await getSupabaseClient();
  let query = client
    .from('examinees')
    .select('*')
    .order('created_at', { ascending: true });

  if (options.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) raise('تعذّر تحميل المختبَرين.', error);
  return ((data ?? []) as DbRow[]).map(mapExaminee);
}

export async function createExaminee(input: ExamineeInput): Promise<Examinee> {
  const client = await getSupabaseClient();
  const name = normalizeName(input.name);
  const defaultAmount = normalizeAmount(input.default_amount);
  const isActive = input.is_active ?? true;

  const { data, error } = await client
    .from('examinees')
    .insert({ name, default_amount: defaultAmount, is_active: isActive })
    .select('*')
    .single();

  if (error) raise('تعذّر إضافة المختبَر.', error);

  const examinee = mapExaminee(data as DbRow);
  if (examinee.is_active) {
    await addExamineeToAllSheets(client, examinee.id, examinee.default_amount);
  }
  return examinee;
}

export async function deleteExaminee(examineeId: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('examinees')
    .delete()
    .eq('id', examineeId);

  if (error) raise('تعذّر حذف المختبَر.', error);
}

export async function updateExaminee(
  examineeId: string,
  patch: ExamineePatch,
): Promise<Examinee> {
  const client = await getSupabaseClient();
  const update: Record<string, string | number | boolean> = {};

  if (patch.name !== undefined) update.name = normalizeName(patch.name);
  if (patch.default_amount !== undefined) {
    update.default_amount = normalizeAmount(patch.default_amount);
  }
  if (patch.is_active !== undefined) update.is_active = patch.is_active;

  if (Object.keys(update).length === 0) {
    throw new MonthlySheetServiceError('لا توجد تغييرات لحفظها.');
  }

  const { data, error } = await client
    .from('examinees')
    .update(update)
    .eq('id', examineeId)
    .select('*')
    .single();

  if (error) raise('تعذّر تحديث المختبَر.', error);

  const examinee = mapExaminee(data as DbRow);
  if (examinee.is_active && patch.is_active === true) {
    await addExamineeToAllSheets(client, examinee.id, examinee.default_amount);
  }
  return examinee;
}

// ---------------------------------------------------------------------------
// Monthly sheets
// ---------------------------------------------------------------------------

export async function fetchMonthlySheets(): Promise<MonthlySheet[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('monthly_sheets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) raise('تعذّر تحميل الشهور.', error);
  return ((data ?? []) as DbRow[]).map(mapMonthlySheet);
}

export async function createMonthlySheet(
  input: MonthlySheetInput,
): Promise<MonthlySheet> {
  const client = await getSupabaseClient();
  const title = normalizeName(input.title);
  const hasFifthWeek = input.has_fifth_week ?? false;

  const { data, error } = await client
    .from('monthly_sheets')
    .insert({ title, has_fifth_week: hasFifthWeek })
    .select('*')
    .single();

  if (error) raise('تعذّر إنشاء الشهر.', error);

  const sheet = mapMonthlySheet(data as DbRow);
  const activeExaminees = (await fetchAllExaminees(client)).filter(
    (examinee) => examinee.is_active,
  );

  if (activeExaminees.length > 0) {
    const { error: recordsError } = await client.from('monthly_records').insert(
      activeExaminees.map((examinee) => ({
        sheet_id: sheet.id,
        examinee_id: examinee.id,
        amount: examinee.default_amount,
      })),
    );

    if (recordsError) {
      await client.from('monthly_sheets').delete().eq('id', sheet.id);
      raise('تعذّر تجهيز صفوف الشهر الجديد.', recordsError);
    }
  }

  return sheet;
}

export async function updateMonthlySheet(
  sheetId: string,
  patch: Partial<MonthlySheetInput>,
): Promise<MonthlySheet> {
  const client = await getSupabaseClient();
  const update: Record<string, string | boolean> = {};

  if (patch.title !== undefined) update.title = normalizeName(patch.title);
  if (patch.has_fifth_week !== undefined) {
    update.has_fifth_week = patch.has_fifth_week;
  }

  if (Object.keys(update).length === 0) {
    throw new MonthlySheetServiceError('لا توجد تغييرات لحفظها.');
  }

  const { data, error } = await client
    .from('monthly_sheets')
    .update(update)
    .eq('id', sheetId)
    .select('*')
    .single();

  if (error) raise('تعذّر تحديث الشهر.', error);
  return mapMonthlySheet(data as DbRow);
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

async function loadRecords(
  client: SupabaseClient,
  sheetId: string,
): Promise<MonthlyRecord[]> {
  const { data, error } = await client
    .from('monthly_records')
    .select('*')
    .eq('sheet_id', sheetId);

  if (error) raise('تعذّر تحميل سجلات الشهر.', error);
  return ((data ?? []) as DbRow[]).map(mapMonthlyRecord);
}

/** Loads a sheet's records, creating missing rows for currently active examinees. */
export async function fetchSheetRows(sheetId: string): Promise<MonthlyRecordRow[]> {
  const client = await getSupabaseClient();
  const allExaminees = await fetchAllExaminees(client);
  let records = await loadRecords(client, sheetId);

  const existingExamineeIds = new Set(records.map((record) => record.examinee_id));
  const missingExaminees = allExaminees.filter(
    (examinee) => examinee.is_active && !existingExamineeIds.has(examinee.id),
  );

  if (missingExaminees.length > 0) {
    const { error } = await client.from('monthly_records').upsert(
      missingExaminees.map((examinee) => ({
        sheet_id: sheetId,
        examinee_id: examinee.id,
        amount: examinee.default_amount,
      })),
      { onConflict: 'sheet_id,examinee_id', ignoreDuplicates: true },
    );

    if (error) raise('تعذّر تجهيز صفوف المختبَرين.', error);
    records = await loadRecords(client, sheetId);
  }

  const examineeMap = new Map(allExaminees.map((examinee) => [examinee.id, examinee]));

  return records
    .flatMap((record) => {
      const examinee = examineeMap.get(record.examinee_id);
      if (!examinee) return [];
      return [{ ...record, examinee }];
    })
    .sort((a, b) => {
      if (a.examinee.is_active !== b.examinee.is_active) {
        return a.examinee.is_active ? -1 : 1;
      }
      return a.examinee.name.localeCompare(b.examinee.name, 'ar');
    });
}

export async function fetchMonthlyRecord(
  sheetId: string,
  examineeId: string,
): Promise<MonthlyRecord | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('monthly_records')
    .select('*')
    .eq('sheet_id', sheetId)
    .eq('examinee_id', examineeId)
    .maybeSingle();

  if (error) raise('تعذّر تحميل سجل المختبَر.', error);
  return data ? mapMonthlyRecord(data as DbRow) : null;
}

export async function updateMonthlyRecord(
  recordId: string,
  patch: MonthlyRecordPatch,
): Promise<MonthlyRecord> {
  const client = await getSupabaseClient();
  const update: Record<string, number | null> = {};

  for (const slot of WEEK_SLOTS) {
    if (patch[slot] !== undefined) {
      update[slot] = normalizeScore(patch[slot] ?? null, `درجة ${slot}`);
    }
  }
  if (patch.monthly_exam !== undefined) {
    update.monthly_exam = normalizeScore(patch.monthly_exam, 'درجة المراجعة الشهرية');
  }
  if (patch.amount !== undefined) {
    update.amount = normalizeAmount(patch.amount);
  }

  if (Object.keys(update).length === 0) {
    throw new MonthlySheetServiceError('لا توجد تغييرات لحفظها.');
  }

  const { data, error } = await client
    .from('monthly_records')
    .update(update)
    .eq('id', recordId)
    .select('*')
    .single();

  if (error) raise('تعذّر حفظ السجل. تحقق من القيم وأعد المحاولة.', error);
  return mapMonthlyRecord(data as DbRow);
}

/**
 * Saves a finished test into one slot of a monthly record. A missing record is
 * created with the examinee's default amount for backwards-compatible sheets.
 */
export async function saveTestMistakes(
  target: SaveTestTarget,
): Promise<MonthlyRecord> {
  const slot = ensureSlot(target.slot);
  const mistakes = normalizeScore(target.mistakes, 'عدد الأخطاء');
  if (mistakes === null) {
    throw new MonthlySheetServiceError('عدد الأخطاء مطلوب.');
  }

  const existing = await fetchMonthlyRecord(target.sheetId, target.examineeId);
  if (existing) {
    return updateMonthlyRecord(existing.id, { [slot]: mistakes });
  }

  const client = await getSupabaseClient();
  const examinee = (await fetchAllExaminees(client)).find(
    (item) => item.id === target.examineeId,
  );
  if (!examinee) {
    throw new MonthlySheetServiceError('المختبَر غير موجود.');
  }

  const { data, error } = await client
    .from('monthly_records')
    .insert({
      sheet_id: target.sheetId,
      examinee_id: target.examineeId,
      amount: examinee.default_amount,
      [slot]: mistakes,
    })
    .select('*')
    .single();

  if (error) raise('تعذّر إنشاء سجل الشهر لهذا المختبَر.', error);
  return mapMonthlyRecord(data as DbRow);
}
