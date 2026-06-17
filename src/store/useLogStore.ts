import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemLog, PaginatedResponse, Notification } from '@/types';
import { mockSystemLogs, mockNotifications } from '@/mock/data';
import { generateId, getCurrentTime } from '@/utils/format';

interface LogState {
  allLogs: SystemLog[];
  logs: SystemLog[];
  notifications: Notification[];
  loading: boolean;
  total: number;

  fetchLogs: (filters?: {
    page?: number;
    pageSize?: number;
    operatorId?: string;
    operationType?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<PaginatedResponse<SystemLog>>;

  addLog: (data: Omit<SystemLog, 'logId' | 'operateTime'>) => void;

  fetchNotifications: (employeeId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (employeeId: string) => Promise<void>;
  getUnreadCount: (employeeId: string) => number;
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      allLogs: [...mockSystemLogs],
      logs: [...mockSystemLogs],
      notifications: [],
      loading: false,
      total: 0,

      fetchLogs: async (filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { page = 1, pageSize = 10, operatorId, operationType, startDate, endDate } = filters;
        let filtered = [...get().allLogs];

        if (operatorId) {
          filtered = filtered.filter((l) => l.operatorId === operatorId);
        }
        if (operationType && operationType !== 'all') {
          filtered = filtered.filter((l) => l.operationType === operationType);
        }
        if (startDate) {
          filtered = filtered.filter((l) => l.operateTime >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((l) => l.operateTime <= endDate + ' 23:59:59');
        }

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const list = filtered.slice(start, start + pageSize);

        set({ logs: filtered, total, loading: false });
        return { list, total, page, pageSize };
      },

      addLog: (data) => {
        const log: SystemLog = {
          ...data,
          logId: generateId('LOG'),
          operateTime: getCurrentTime(),
        };
        set((state) => ({
          allLogs: [log, ...state.allLogs],
          logs: [log, ...state.logs],
        }));
      },

      fetchNotifications: async (employeeId: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const notifs = mockNotifications.filter((n) => n.employeeId === employeeId);
        set({ notifications: notifs, loading: false });
      },

      markAsRead: async (id: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        const notif = mockNotifications.find((n) => n.id === id);
        if (notif) {
          notif.isRead = true;
        }

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          loading: false,
        }));
      },

      markAllAsRead: async (employeeId: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        mockNotifications.forEach((n) => {
          if (n.employeeId === employeeId) {
            n.isRead = true;
          }
        });

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.employeeId === employeeId ? { ...n, isRead: true } : n
          ),
          loading: false,
        }));
      },

      getUnreadCount: (employeeId: string) => {
        return get().notifications.filter((n) => n.employeeId === employeeId && !n.isRead).length;
      },
    }),
    {
      name: 'log-storage',
      partialize: (state) => ({ allLogs: state.allLogs, logs: state.logs }),
    }
  )
);
