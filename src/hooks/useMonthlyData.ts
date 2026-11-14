import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  createExaminee,
  createMonthlySheet,
  deleteExaminee,
  fetchExaminees,
  fetchMonthlySheets,
  fetchSheetRows,
  updateExaminee,
  updateMonthlyRecord,
  updateMonthlySheet,
} from '../services/monthlySheetService';
import type {
  Examinee,
  ExamineeInput,
  ExamineePatch,
  MonthlyRecord,
  MonthlyRecordPatch,
  MonthlyRecordRow,
  MonthlySheet,
  MonthlySheetInput,
} from '../types/monthlySheet';

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.';
}

export interface MonthlyDataState {
  configured: boolean;
  examinees: Examinee[];
  sheets: MonthlySheet[];
  selectedSheetId: string | null;
  selectedSheet: MonthlySheet | null;
  rows: MonthlyRecordRow[];
  loading: boolean;
  rowsLoading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  selectSheet: (sheetId: string) => void;
  addExaminee: (input: ExamineeInput) => Promise<Examinee>;
  editExaminee: (examineeId: string, patch: ExamineePatch) => Promise<Examinee>;
  removeExaminee: (examineeId: string) => Promise<void>;
  addSheet: (input: MonthlySheetInput) => Promise<MonthlySheet>;
  editSheet: (
    sheetId: string,
    patch: Partial<MonthlySheetInput>,
  ) => Promise<MonthlySheet>;
  saveRecord: (
    recordId: string,
    patch: MonthlyRecordPatch,
  ) => Promise<MonthlyRecord>;
}

export function useMonthlyData(): MonthlyDataState {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [sheets, setSheets] = useState<MonthlySheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [rows, setRows] = useState<MonthlyRecordRow[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedSheetRef = useRef<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadRows = useCallback(async (sheetId: string) => {
    setRowsLoading(true);
    try {
      const nextRows = await fetchSheetRows(sheetId);
      if (selectedSheetRef.current !== sheetId) return;
      setRows(nextRows);
    } catch (loadError) {
      if (selectedSheetRef.current !== sheetId) return;
      setRows([]);
      setError(errorMessage(loadError));
    } finally {
      if (selectedSheetRef.current === sheetId) {
        setRowsLoading(false);
      }
    }
  }, []);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextExaminees, nextSheets] = await Promise.all([
        fetchExaminees(),
        fetchMonthlySheets(),
      ]);
      setExaminees(nextExaminees);
      setSheets(nextSheets);
      setSelectedSheetId((current) => {
        if (current && nextSheets.some((sheet) => sheet.id === current)) {
          return current;
        }
        return nextSheets[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    selectedSheetRef.current = selectedSheetId;

    if (!selectedSheetId) {
      setRows([]);
      return;
    }

    setRows([]);
    void loadRows(selectedSheetId);
  }, [loadRows, selectedSheetId]);

  const addExaminee = useCallback(
    async (input: ExamineeInput) => {
      setError(null);
      try {
        const examinee = await createExaminee(input);
        setExaminees((current) => [...current, examinee]);
        if (selectedSheetId) {
          await loadRows(selectedSheetId);
        }
        return examinee;
      } catch (createError) {
        setError(errorMessage(createError));
        throw createError;
      }
    },
    [loadRows, selectedSheetId],
  );

  const editExaminee = useCallback(
    async (examineeId: string, patch: ExamineePatch) => {
      setError(null);
      try {
        const examinee = await updateExaminee(examineeId, patch);
        setExaminees((current) =>
          current.map((item) => (item.id === examinee.id ? examinee : item)),
        );
        setRows((current) =>
          current.map((row) =>
            row.examinee_id === examinee.id ? { ...row, examinee } : row,
          ),
        );
        return examinee;
      } catch (updateError) {
        setError(errorMessage(updateError));
        throw updateError;
      }
    },
    [],
  );

  const removeExaminee = useCallback(async (examineeId: string) => {
    setError(null);
    try {
      await deleteExaminee(examineeId);
      setExaminees((current) =>
        current.filter((examinee) => examinee.id !== examineeId),
      );
      setRows((current) =>
        current.filter((row) => row.examinee_id !== examineeId),
      );
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      throw deleteError;
    }
  }, []);

  const addSheet = useCallback(async (input: MonthlySheetInput) => {
    setError(null);
    try {
      const sheet = await createMonthlySheet(input);
      setSheets((current) => [sheet, ...current]);
      setSelectedSheetId(sheet.id);
      return sheet;
    } catch (createError) {
      setError(errorMessage(createError));
      throw createError;
    }
  }, []);

  const editSheet = useCallback(
    async (sheetId: string, patch: Partial<MonthlySheetInput>) => {
      setError(null);
      try {
        const sheet = await updateMonthlySheet(sheetId, patch);
        setSheets((current) =>
          current.map((item) => (item.id === sheet.id ? sheet : item)),
        );
        return sheet;
      } catch (updateError) {
        setError(errorMessage(updateError));
        throw updateError;
      }
    },
    [],
  );

  const saveRecord = useCallback(
    async (recordId: string, patch: MonthlyRecordPatch) => {
      setError(null);
      try {
        const record = await updateMonthlyRecord(recordId, patch);
        setRows((current) =>
          current.map((row) =>
            row.id === record.id ? { ...row, ...record } : row,
          ),
        );
        return record;
      } catch (updateError) {
        setError(errorMessage(updateError));
        throw updateError;
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    await load();
    if (selectedSheetId) {
      await loadRows(selectedSheetId);
    }
  }, [load, loadRows, selectedSheetId]);

  return {
    configured: isSupabaseConfigured,
    examinees,
    sheets,
    selectedSheetId,
    selectedSheet: sheets.find((sheet) => sheet.id === selectedSheetId) ?? null,
    rows,
    loading,
    rowsLoading,
    error,
    clearError,
    refresh,
    selectSheet: setSelectedSheetId,
    addExaminee,
    editExaminee,
    removeExaminee,
    addSheet,
    editSheet,
    saveRecord,
  };
}
