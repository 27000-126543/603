import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, PaginatedResponse } from '@/types';
import { mockExpenses, mockAccessRecords } from '@/mock/data';
import { getCurrentMonth, getCurrentTime, generateId } from '@/utils/format';

interface AddExpenseRequest {
  recordId: string;
  employeeId?: string;
  employeeName?: string;
  plateNumber: string;
  amount: number;
  overtimeMinutes: number;
  entryTime: string;
  exitTime: string;
}

interface FinanceState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  total: number;

  fetchExpenses: (filters?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    month?: string;
    status?: string;
  }) => Promise<PaginatedResponse<Expense>>;

  addExpense: (data: AddExpenseRequest) => Promise<Expense>;
  processDeduction: (expenseId: string) => Promise<void>;
  processBulkDeduction: (expenseIds: string[]) => Promise<void>;
  exemptExpense: (expenseId: string, reason: string) => Promise<void>;
  getMonthlySummary: (month?: string, employeeId?: string) => {
    totalAmount: number;
    totalCount: number;
    deductedAmount: number;
    pendingAmount: number;
    avgOvertime: number;
  };
  getDepartmentStats: () => Array<{ department: string; count: number; amount: number }>;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      expenses: [],
      loading: false,
      error: null,
      total: 0,

      fetchExpenses: async (filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { page = 1, pageSize = 10, employeeId, month, status } = filters;
        const state = get();
        let filtered = state.expenses.length > 0 ? [...state.expenses] : [...mockExpenses];

        if (employeeId) {
          filtered = filtered.filter((e) => e.employeeId === employeeId);
        }
        if (month) {
          filtered = filtered.filter((e) => e.salaryMonth === month);
        }
        if (status) {
          filtered = filtered.filter((e) => e.status === status);
        }

        filtered.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const list = filtered.slice(start, start + pageSize);

        set({ expenses: filtered, total, loading: false });
        return { list, total, page, pageSize };
      },

      addExpense: async (data) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const salaryMonth = new Date().toISOString().slice(0, 7);

        const expense: Expense = {
          expenseId: generateId('EXP'),
          recordId: data.recordId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          plateNumber: data.plateNumber,
          amount: data.amount,
          overtimeMinutes: data.overtimeMinutes,
          entryTime: data.entryTime,
          exitTime: data.exitTime,
          salaryMonth,
          status: 'pending',
          createTime: getCurrentTime(),
        };

        mockExpenses.unshift(expense);

        set((state) => ({
          expenses: [expense, ...state.expenses],
          loading: false,
        }));

        return expense;
      },

      processDeduction: async (expenseId: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockExpense = mockExpenses.find((e) => e.expenseId === expenseId);
        if (mockExpense) {
          mockExpense.status = 'deducted';
          mockExpense.deductedTime = getCurrentTime();
        }

        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.expenseId === expenseId ? { ...e, status: 'deducted' as const, deductedTime: getCurrentTime() } : e
          ),
          loading: false,
        }));
      },

      processBulkDeduction: async (expenseIds: string[]) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));

        const now = getCurrentTime();
        expenseIds.forEach((id) => {
          const mockExpense = mockExpenses.find((e) => e.expenseId === id);
          if (mockExpense) {
            mockExpense.status = 'deducted';
            mockExpense.deductedTime = now;
          }
        });

        set((state) => ({
          expenses: state.expenses.map((e) =>
            expenseIds.includes(e.expenseId) ? { ...e, status: 'deducted' as const, deductedTime: now } : e
          ),
          loading: false,
        }));
      },

      exemptExpense: async (expenseId: string, reason: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockExpense = mockExpenses.find((e) => e.expenseId === expenseId);
        if (mockExpense) {
          mockExpense.status = 'exempted';
          mockExpense.exemptReason = reason;
          mockExpense.exemptTime = getCurrentTime();
        }

        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.expenseId === expenseId
              ? { ...e, status: 'exempted' as const, exemptReason: reason, exemptTime: getCurrentTime() }
              : e
          ),
          loading: false,
        }));
      },

      getMonthlySummary: (month?: string, employeeId?: string) => {
        const targetMonth = month || getCurrentMonth();
        const state = get();
        let monthExpenses = state.expenses.length > 0 ? state.expenses : mockExpenses;
        monthExpenses = monthExpenses.filter((e) => e.salaryMonth === targetMonth);

        if (employeeId) {
          monthExpenses = monthExpenses.filter((e) => e.employeeId === employeeId);
        }

        const totalOvertime = monthExpenses.reduce((sum, e) => sum + (e.overtimeMinutes || 0), 0);

        return {
          totalAmount: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
          totalCount: monthExpenses.length,
          deductedAmount: monthExpenses
            .filter((e) => e.status === 'deducted')
            .reduce((sum, e) => sum + e.amount, 0),
          pendingAmount: monthExpenses
            .filter((e) => e.status === 'pending')
            .reduce((sum, e) => sum + e.amount, 0),
          avgOvertime: monthExpenses.length > 0 ? Math.round(totalOvertime / monthExpenses.length) : 0,
        };
      },

      getDepartmentStats: () => {
        const deptMap = new Map<string, { count: number; amount: number }>();
        const state = get();
        const allExpenses = state.expenses.length > 0 ? state.expenses : mockExpenses;

        allExpenses.forEach((expense) => {
          const record = mockAccessRecords.find((r) => r.recordId === expense.recordId);
          if (record?.employeeId) {
            const key = expense.employeeName || '未知';
            const current = deptMap.get(key) || { count: 0, amount: 0 };
            deptMap.set(key, {
              count: current.count + 1,
              amount: current.amount + expense.amount,
            });
          }
        });

        return Array.from(deptMap.entries()).map(([department, stats]) => ({
          department,
          ...stats,
        }));
      },
    }),
    {
      name: 'finance-storage',
      partialize: (state) => ({
        expenses: state.expenses,
      }),
    }
  )
);
