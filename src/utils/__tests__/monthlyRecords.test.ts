import { describe, expect, it } from 'vitest';
import {
  calculateTotalMistakes,
  getDroppedWeek,
  getRecordedSlots,
} from '../monthlyRecords';

describe('calculateTotalMistakes', () => {
  it('drops the highest recorded week and adds the monthly exam', () => {
    expect(
      calculateTotalMistakes({
        week_1: 1,
        week_2: 2,
        week_3: 0,
        week_4: 0,
        week_5: 0,
        monthly_exam: 4,
      }),
    ).toBe(5);
  });

  it('matches the requested example without a monthly exam', () => {
    expect(
      calculateTotalMistakes({
        week_1: 1,
        week_2: 2,
        week_3: 0,
        week_4: 0,
        week_5: 0,
        monthly_exam: null,
      }),
    ).toBe(1);
  });

  it('ignores null weeks and drops the highest among recorded weeks only', () => {
    expect(
      calculateTotalMistakes({
        week_1: null,
        week_2: 3,
        week_3: null,
        week_4: 1,
        week_5: null,
        monthly_exam: null,
      }),
    ).toBe(1);
  });

  it('drops the only recorded week, leaving zero weekly mistakes', () => {
    expect(
      calculateTotalMistakes({
        week_1: null,
        week_2: 7,
        week_3: null,
        week_4: null,
        week_5: null,
        monthly_exam: 2,
      }),
    ).toBe(2);
  });

  it('includes the fifth week when it is recorded', () => {
    expect(
      calculateTotalMistakes({
        week_1: 2,
        week_2: null,
        week_3: 4,
        week_4: 1,
        week_5: 5,
        monthly_exam: 3,
      }),
    ).toBe(10);
  });

  it('returns the monthly exam when no weeks are recorded', () => {
    expect(
      calculateTotalMistakes({
        week_1: null,
        week_2: null,
        week_3: null,
        week_4: null,
        week_5: null,
        monthly_exam: 6,
      }),
    ).toBe(6);
  });

  it('returns zero for an empty record', () => {
    expect(calculateTotalMistakes({})).toBe(0);
  });

  it('handles recorded zeroes correctly', () => {
    expect(
      calculateTotalMistakes({
        week_1: 0,
        week_2: 0,
        week_3: 0,
        week_4: null,
        week_5: null,
        monthly_exam: null,
      }),
    ).toBe(0);
  });
});

describe('weekly score helpers', () => {
  it('reports the dropped week and the recorded slots', () => {
    const record = {
      week_1: 1,
      week_2: 4,
      week_3: null,
      week_4: 2,
      week_5: null,
      monthly_exam: null,
    };

    expect(getDroppedWeek(record)).toBe(4);
    expect(getRecordedSlots(record)).toEqual(['week_1', 'week_2', 'week_4']);
  });

  it('returns null when no week is recorded', () => {
    expect(getDroppedWeek({ monthly_exam: 2 })).toBeNull();
  });
});
