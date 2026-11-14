/** Domain types for the Supabase-backed monthly tracking dashboard. */

export type SheetSlot =
  | 'week_1'
  | 'week_2'
  | 'week_3'
  | 'week_4'
  | 'week_5'
  | 'monthly_exam';

export const SHEET_SLOTS: readonly SheetSlot[] = [
  'week_1',
  'week_2',
  'week_3',
  'week_4',
  'week_5',
  'monthly_exam',
];

export const WEEK_SLOTS: readonly SheetSlot[] = [
  'week_1',
  'week_2',
  'week_3',
  'week_4',
  'week_5',
];

export const SHEET_SLOT_LABELS: Record<SheetSlot, string> = {
  week_1: 'الأسبوع الأول',
  week_2: 'الأسبوع الثاني',
  week_3: 'الأسبوع الثالث',
  week_4: 'الأسبوع الرابع',
  week_5: 'الأسبوع الخامس',
  monthly_exam: 'المراجعة الشهرية',
};

export const SHEET_SLOT_SHORT_LABELS: Record<SheetSlot, string> = {
  week_1: 'الأسبوع ١',
  week_2: 'الأسبوع ٢',
  week_3: 'الأسبوع ٣',
  week_4: 'الأسبوع ٤',
  week_5: 'الأسبوع ٥',
  monthly_exam: 'الشهري',
};

export interface Examinee {
  id: string;
  name: string;
  default_amount: number;
  is_active: boolean;
  created_at: string;
}

export interface ExamineeInput {
  name: string;
  default_amount: number;
  is_active?: boolean;
}

export type ExamineePatch = Partial<ExamineeInput>;

export interface MonthlySheet {
  id: string;
  title: string;
  has_fifth_week: boolean;
  created_at: string;
}

export interface MonthlySheetInput {
  title: string;
  has_fifth_week?: boolean;
}

/** A row exactly as returned by PostgreSQL, including its generated total. */
export interface MonthlyRecord {
  id: string;
  sheet_id: string;
  examinee_id: string;
  week_1: number | null;
  week_2: number | null;
  week_3: number | null;
  week_4: number | null;
  week_5: number | null;
  monthly_exam: number | null;
  amount: number;
  total_mistakes: number;
  updated_at: string;
}

/** Score fields accepted by calculateTotalMistakes and inline cell updates. */
export interface MonthlyScoreFields {
  week_1: number | null;
  week_2: number | null;
  week_3: number | null;
  week_4: number | null;
  week_5: number | null;
  monthly_exam: number | null;
}

export type MonthlyRecordPatch = Partial<MonthlyScoreFields> & {
  amount?: number;
};

/** A record joined with its examinee for the dashboard table. */
export interface MonthlyRecordRow extends MonthlyRecord {
  examinee: Examinee;
}

export interface SaveTestTarget {
  sheetId: string;
  examineeId: string;
  slot: SheetSlot;
  mistakes: number;
}
