import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AccessRecord, PaginatedResponse } from '@/types';
import { mockAccessRecords, mockEmployees } from '@/mock/data';
import { generateId, getCurrentTime } from '@/utils/format';
import { calculateParkingFee } from '@/utils/business';
import { useFinanceStore } from './useFinanceStore';
import { formatPlateNumber } from '@/utils/format';

interface RecordState {
  records: AccessRecord[];
  loading: boolean;
  error: string | null;
  total: number;

  fetchRecords: (filters?: {
    page?: number;
    pageSize?: number;
    plateNumber?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<PaginatedResponse<AccessRecord>>;

  createEntryRecord: (plateNumber: string, employeeId?: string) => Promise<AccessRecord | null>;
  createExitRecord: (recordId: string, exitTime?: string) => Promise<AccessRecord | null>;
  getRecordById: (id: string) => AccessRecord | undefined;
  getTodayStats: (employeeId?: string) => { entryCount: number; exitCount: number };
  findActiveRecord: (plateNumber: string) => AccessRecord | undefined;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      records: [],
      loading: false,
      error: null,
      total: 0,

      fetchRecords: async (filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { page = 1, pageSize = 10, plateNumber, employeeId, startDate, endDate } = filters;
        const state = get();
        let filtered = state.records.length > 0 ? [...state.records] : [...mockAccessRecords];

        if (plateNumber) {
          filtered = filtered.filter((r) => r.plateNumber.includes(plateNumber.toUpperCase()));
        }
        if (employeeId) {
          filtered = filtered.filter((r) => r.employeeId === employeeId);
        }
        if (startDate) {
          filtered = filtered.filter((r) => r.entryTime >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((r) => r.entryTime <= endDate + ' 23:59:59');
        }

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const list = filtered.slice(start, start + pageSize);

        set({ records: filtered, total, loading: false });
        return { list, total, page, pageSize };
      },

      findActiveRecord: (plateNumber: string) => {
        const formattedPlate = formatPlateNumber(plateNumber);
        const state = get();
        const allRecords = state.records.length > 0 ? state.records : mockAccessRecords;
        return allRecords.find((r) => r.plateNumber === formattedPlate && !r.exitTime);
      },

      createEntryRecord: async (plateNumber: string, employeeId?: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const formattedPlate = formatPlateNumber(plateNumber);
        const state = get();
        
        const existingActive = state.findActiveRecord(formattedPlate);
        if (existingActive) {
          set({ loading: false, error: '该车辆已在场' });
          return null;
        }

        const employee = employeeId ? mockEmployees.find((e) => e.employeeId === employeeId) : null;

        const record: AccessRecord = {
          recordId: generateId('REC'),
          plateNumber: formattedPlate,
          employeeId,
          employeeName: employee?.name,
          entryTime: getCurrentTime(),
        };

        mockAccessRecords.unshift(record);

        set((state) => ({
          records: [record, ...state.records],
          loading: false,
        }));

        return record;
      },

      createExitRecord: async (recordId: string, exitTime?: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const state = get();
        let record = state.records.find((r) => r.recordId === recordId);
        
        if (!record) {
          record = mockAccessRecords.find((r) => r.recordId === recordId);
        }

        if (!record || record.exitTime) {
          set({ loading: false });
          return null;
        }

        const actualExitTime = exitTime || getCurrentTime();
        const fee = calculateParkingFee(record.entryTime, actualExitTime);

        const updatedRecord: AccessRecord = {
          ...record,
          exitTime: actualExitTime,
          durationMinutes: fee.durationMinutes,
          overtimeMinutes: fee.overtimeMinutes,
          expense: fee.amount,
        };

        const mockRecord = mockAccessRecords.find((r) => r.recordId === recordId);
        if (mockRecord) {
          mockRecord.exitTime = actualExitTime;
          mockRecord.durationMinutes = fee.durationMinutes;
          mockRecord.overtimeMinutes = fee.overtimeMinutes;
          mockRecord.expense = fee.amount;
        }

        set((state) => ({
          records: state.records.map((r) =>
            r.recordId === recordId ? updatedRecord : r
          ),
          loading: false,
        }));

        if (fee.amount > 0) {
          const financeState = useFinanceStore.getState();
          await financeState.addExpense({
            recordId: updatedRecord.recordId,
            employeeId: updatedRecord.employeeId,
            employeeName: updatedRecord.employeeName,
            plateNumber: updatedRecord.plateNumber,
            amount: fee.amount,
            overtimeMinutes: fee.overtimeMinutes,
            entryTime: updatedRecord.entryTime,
            exitTime: actualExitTime,
          });
        }

        return updatedRecord;
      },

      getRecordById: (id: string) => {
        const state = get();
        return state.records.find((r) => r.recordId === id) ||
          mockAccessRecords.find((r) => r.recordId === id);
      },

      getTodayStats: (employeeId?: string) => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        let todayRecords = state.records.length > 0 
          ? state.records.filter((r) => r.entryTime.startsWith(today))
          : mockAccessRecords.filter((r) => r.entryTime.startsWith(today));

        if (employeeId) {
          todayRecords = todayRecords.filter((r) => r.employeeId === employeeId);
        }

        return {
          entryCount: todayRecords.length,
          exitCount: todayRecords.filter((r) => r.exitTime).length,
        };
      },
    }),
    {
      name: 'record-storage',
      partialize: (state) => ({
        records: state.records,
      }),
    }
  )
);
