import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  interface Row {
    [key: string]: unknown;
  }
  interface Db {
    examinees: Row[];
    sheets: Row[];
    records: Row[];
    examineeInserts: Row[];
  }

  let db: Db;
  let examineeSeq = 0;
  let recordSeq = 0;

  function recordRow(payload: Row): Row {
    return {
      id: payload.id ?? `record-${++recordSeq}`,
      week_1: null,
      week_2: null,
      week_3: null,
      week_4: null,
      week_5: null,
      monthly_exam: null,
      amount: 0,
      total_mistakes: 0,
      updated_at: '2026-11-19T00:00:00.000Z',
      ...payload,
    };
  }

  function createClient() {
    return {
      from(table: string) {
        if (table === 'examinees') {
          return {
            select() {
              return {
                order() {
                  return Promise.resolve({ data: db.examinees, error: null });
                },
              };
            },
            insert(payload: Row) {
              const row = {
                id: `examinee-${++examineeSeq}`,
                default_amount: 0,
                is_active: true,
                created_at: '2026-11-19T00:00:00.000Z',
                ...payload,
              };
              db.examinees.push(row);
              db.examineeInserts.push(payload);
              return {
                select() {
                  return {
                    async single() {
                      return { data: row, error: null };
                    },
                  };
                },
              };
            },
          };
        }

        if (table === 'monthly_sheets') {
          return {
            select() {
              return {
                order() {
                  return Promise.resolve({ data: db.sheets, error: null });
                },
                then(resolve: (value: unknown) => unknown) {
                  return Promise.resolve({
                    data: db.sheets.map((sheet) => ({ id: sheet.id })),
                    error: null,
                  }).then(resolve);
                },
              };
            },
          };
        }

        if (table === 'monthly_records') {
          return {
            select() {
              let sheetId: unknown;
              let examineeId: unknown;
              const builder = {
                eq(column: string, value: unknown) {
                  if (column === 'sheet_id') sheetId = value;
                  if (column === 'examinee_id') examineeId = value;
                  return builder;
                },
                async maybeSingle() {
                  return {
                    data:
                      db.records.find(
                        (record) =>
                          record.sheet_id === sheetId &&
                          record.examinee_id === examineeId,
                      ) ?? null,
                    error: null,
                  };
                },
              };
              return builder;
            },
            upsert(rows: Row[]) {
              for (const row of rows) {
                const exists = db.records.some(
                  (record) =>
                    record.sheet_id === row.sheet_id &&
                    record.examinee_id === row.examinee_id,
                );
                if (!exists) db.records.push(recordRow(row));
              }
              return Promise.resolve({ error: null });
            },
            update(payload: Row) {
              return {
                eq(_column: string, value: unknown) {
                  return {
                    select() {
                      return {
                        async single() {
                          const record = db.records.find(
                            (item) => item.id === value,
                          );
                          Object.assign(record ?? {}, payload);
                          return { data: record ?? null, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
            insert(payload: Row) {
              const row = recordRow(payload);
              db.records.push(row);
              return {
                select() {
                  return {
                    async single() {
                      return { data: row, error: null };
                    },
                  };
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };
  }

  function reset(): Db {
    db = {
      examinees: [
        {
          id: 'examinee-1',
          name: 'ش. عمر مجدي',
          default_amount: 0,
          is_active: true,
          created_at: '2026-11-14T10:34:52.000Z',
        },
      ],
      sheets: [
        {
          id: 'sheet-new',
          title: 'شهر جديد',
          has_fifth_week: false,
          created_at: '2026-11-01T00:00:00.000Z',
        },
        {
          id: 'sheet-old',
          title: 'شهر قديم',
          has_fifth_week: false,
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ],
      records: [],
      examineeInserts: [],
    };
    examineeSeq = 0;
    recordSeq = 0;
    return db;
  }

  return {
    reset,
    get db() {
      return db;
    },
    client: createClient(),
  };
});

vi.mock('../../lib/supabase', () => ({
  getSupabaseClient: async () => state.client,
  isSupabaseConfigured: true,
}));

import { saveResolvedTestScore } from '../monthlySheetService';

describe('saveResolvedTestScore', () => {
  it('saves by examinee name into the newest sheet when ids are missing', async () => {
    state.reset();

    const record = await saveResolvedTestScore({
      slot: 'week_1',
      score: 1.75,
      examineeName: 'ش. عمر مجدي',
    });

    expect(state.db.examineeInserts).toHaveLength(0);
    expect(record.sheet_id).toBe('sheet-new');
    expect(record.examinee_id).toBe('examinee-1');
    expect(record.week_1).toBe(1.75);
  });

  it('creates an examinee typed offline and then saves the result', async () => {
    state.reset();

    const record = await saveResolvedTestScore({
      slot: 'week_2',
      score: 2,
      examineeName: 'طالب جديد',
    });

    expect(state.db.examineeInserts).toEqual([
      { name: 'طالب جديد', default_amount: 0, is_active: true },
    ]);
    expect(state.db.examinees.some((item) => item.name === 'طالب جديد')).toBe(
      true,
    );
    expect(record.week_2).toBe(2);
  });

  it('matches a sheet by title when the id was not cached', async () => {
    state.reset();

    const record = await saveResolvedTestScore({
      slot: 'week_3',
      score: 0.5,
      examineeName: 'ش. عمر مجدي',
      sheetTitle: 'شهر قديم',
    });

    expect(record.sheet_id).toBe('sheet-old');
    expect(record.week_3).toBe(0.5);
  });

  it('rejects a target without an examinee identity', async () => {
    state.reset();

    await expect(
      saveResolvedTestScore({ slot: 'week_1', score: 1 }),
    ).rejects.toThrow('تعذّر تحديد المختبَر');
  });
});
