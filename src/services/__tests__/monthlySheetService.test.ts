import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  const updates: Array<Record<string, unknown>> = [];
  const row = {
    id: 'record-1',
    sheet_id: 'sheet-1',
    examinee_id: 'examinee-1',
    week_1: null,
    week_2: null,
    week_3: null,
    week_4: null,
    week_5: null,
    monthly_exam: null,
    amount: 500,
    total_mistakes: 0,
    updated_at: '2026-11-15T00:00:00.000Z',
  };

  const client = {
    from(table: string) {
      if (table !== 'monthly_records') {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        update(payload: Record<string, unknown>) {
          updates.push(payload);
          return {
            eq() {
              return {
                select() {
                  return {
                    async single() {
                      return { data: { ...row, ...payload }, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return { updates, client };
});

vi.mock('../../lib/supabase', () => ({
  getSupabaseClient: async () => state.client,
  isSupabaseConfigured: true,
}));

import { updateMonthlyRecord } from '../monthlySheetService';

describe('updateMonthlyRecord', () => {
  it('updates only scores and derives the amount from the new total', async () => {
    state.updates.length = 0;

    const record = await updateMonthlyRecord('record-1', { monthly_exam: 3 });

    expect(state.updates).toEqual([{ monthly_exam: 3 }]);
    expect(record.total_mistakes).toBe(3);
    expect(record.amount).toBe(-100);
  });

  it('preserves fractional monthly scores', async () => {
    state.updates.length = 0;

    const record = await updateMonthlyRecord('record-1', { monthly_exam: 2.5 });

    expect(state.updates).toEqual([{ monthly_exam: 2.5 }]);
    expect(record.total_mistakes).toBe(2.5);
    expect(record.amount).toBe(0);
  });

  it('preserves fractional weekly scores', async () => {
    state.updates.length = 0;

    const record = await updateMonthlyRecord('record-1', {
      week_1: 1.5,
      week_2: 2.25,
    });

    expect(state.updates).toEqual([{ week_1: 1.5, week_2: 2.25 }]);
    expect(record.total_mistakes).toBe(1.5);
    expect(record.amount).toBe(0);
  });
});
