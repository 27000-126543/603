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
    keyword?: string;
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

        const operationTypeGroups: Record<string, string[]> = {
          '审批相关': ['审核申请', '拒绝申请'],
          '车位配置相关': ['新增停车区域', '修改停车区域', '删除停车区域'],
          '扣费相关': ['费用扣除', '单条扣费', '批量扣费'],
          '申请相关': ['提交申请', '审核申请', '拒绝申请'],
          '车位相关': ['分配车位', '释放车位', '更新车位状态', '调整停车位'],
          '出入相关': ['车辆入场', '车辆出场'],
          '续期相关': ['续期申请', '续期提醒', '冻结通行权限'],
        };

        const { page = 1, pageSize = 10, operatorId, operationType, startDate, endDate, keyword } = filters;
        let filtered = [...get().allLogs];

        if (operatorId) {
          filtered = filtered.filter((l) => l.operatorId === operatorId);
        }
        if (operationType && operationType !== 'all') {
          if (operationTypeGroups[operationType]) {
            filtered = filtered.filter((l) => operationTypeGroups[operationType].includes(l.operationType));
          } else {
            filtered = filtered.filter((l) => l.operationType === operationType);
          }
        }
        if (startDate) {
          filtered = filtered.filter((l) => l.operateTime >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((l) => l.operateTime <= endDate + ' 23:59:59');
        }
        if (keyword) {
          const kw = keyword.toLowerCase();
          filtered = filtered.filter((l) =>
            l.operatorName.toLowerCase().includes(kw) ||
            l.operatorId.toLowerCase().includes(kw) ||
            l.detail.toLowerCase().includes(kw)
          );
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
