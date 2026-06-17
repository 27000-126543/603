import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Application,
  CreateApplicationRequest,
  PaginatedResponse,
} from '@/types';
import { mockApplications, mockEmployees, mockParkingZones, mockParkingSpaces } from '@/mock/data';
import { generateApplication, assignParkingSpace, validateDrivingLicense } from '@/utils/business';
import { getCurrentTime, getDateAfterMonths } from '@/utils/date';
import { generateId } from '@/utils/format';
import { useParkingStore } from './useParkingStore';

interface ApplicationState {
  myApplications: Application[];
  allApplications: Application[];
  allApplicationsFull: Application[];
  waitingQueue: Application[];
  loading: boolean;
  error: string | null;
  total: number;

  fetchMyApplications: (employeeId: string) => Promise<void>;
  fetchAllApplications: (filters?: {
    page?: number;
    pageSize?: number;
    status?: string;
    employeeId?: string;
    plateNumber?: string;
  }) => Promise<PaginatedResponse<Application>>;
  fetchWaitingQueue: () => Promise<void>;
  submitApplication: (
    employeeId: string,
    data: CreateApplicationRequest
  ) => Promise<{ success: boolean; message: string; data?: Application }>;
  approveApplication: (id: string) => Promise<Application | null>;
  rejectApplication: (id: string, reason: string) => Promise<void>;
  renewApplication: (id: string) => Promise<void>;
  getApplicationById: (id: string) => Application | undefined;
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      myApplications: [],
      allApplications: [],
      allApplicationsFull: [...mockApplications],
      waitingQueue: [],
      loading: false,
      error: null,
      total: 0,

      fetchMyApplications: async (employeeId: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const state = get();
        let filtered = state.allApplicationsFull.filter((a) => a.employeeId === employeeId);
        if (filtered.length === 0) {
          filtered = mockApplications.filter((a) => a.employeeId === employeeId);
        }
        set({ myApplications: filtered, loading: false });
      },

      fetchAllApplications: async (filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { page = 1, pageSize = 10, status, employeeId, plateNumber } = filters;
        const state = get();
        let filtered = [...state.allApplicationsFull];

        if (status && status !== 'all') {
          filtered = filtered.filter((a) => a.status === status);
        }
        if (employeeId) {
          filtered = filtered.filter((a) => a.employeeId === employeeId);
        }
        if (plateNumber) {
          filtered = filtered.filter((a) => a.plateNumber.includes(plateNumber.toUpperCase()));
        }

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const list = filtered.slice(start, start + pageSize);

        set({ allApplications: filtered, total, loading: false });
        return { list, total, page, pageSize };
      },

      fetchWaitingQueue: async () => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const state = get();
        let waiting = state.allApplications.filter((a) => a.status === 'waiting');
        if (waiting.length === 0) {
          waiting = mockApplications.filter((a) => a.status === 'waiting');
        }
        set({ waitingQueue: waiting, loading: false });
      },

      submitApplication: async (employeeId: string, data: CreateApplicationRequest) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));

        const employee = mockEmployees.find((e) => e.employeeId === employeeId);
        if (!employee) {
          set({ loading: false, error: '用户不存在' });
          return { success: false, message: '用户不存在' };
        }

        const validation = validateDrivingLicense(data.ownerName, employee.name, data.plateNumber);
        if (!validation.valid) {
          set({ loading: false, error: validation.message });
          return { success: false, message: validation.message };
        }

        const application = generateApplication(employeeId, employee.name, data);

        const parkingState = useParkingStore.getState();
        const assignment = assignParkingSpace(
          application,
          employee,
          parkingState.zones,
          parkingState.spaces
        );

        if (assignment.success) {
          const assignResult = await parkingState.assignSpace({
            applicationId: application.applicationId,
            zoneId: assignment.zoneId,
            spaceId: assignment.spaceId,
          });

          if (assignResult.success && assignResult.space) {
            application.status = 'approved';
            application.approvedDate = getCurrentTime();
            application.parkingZoneId = assignment.zoneId;
            application.parkingSpaceId = assignment.spaceId;
            application.spaceType = assignment.spaceType;

            const zone = parkingState.zones.find((z) => z.zoneId === assignment.zoneId);
            application.parkingZoneName = zone?.zoneName;
            application.parkingSpaceNumber = assignResult.space.spaceNumber;
          } else {
            application.status = 'waiting';
            const estimatedWait = await parkingState.findAvailableSpace(
              employeeId,
              employee.positionLevel,
              employee.department
            );
            application.estimatedWaitHours = estimatedWait.estimatedWaitHours || 24;
          }
        } else if (assignment.inQueue) {
          application.status = 'waiting';
          application.estimatedWaitHours = assignment.estimatedWaitHours;
        }

        mockApplications.unshift(application);

        set((state) => ({
          myApplications: [application, ...state.myApplications],
          allApplications: [application, ...state.allApplications],
          allApplicationsFull: [application, ...state.allApplicationsFull],
          loading: false,
        }));

        return {
          success: true,
          message: application.status === 'approved'
            ? '申请提交成功，已自动分配车位'
            : `申请提交成功，已进入等待队列，预计等待约${application.estimatedWaitHours || 24}小时`,
          data: application,
        };
      },

      approveApplication: async (id: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        let app = mockApplications.find((a) => a.applicationId === id);
        if (!app) {
          app = get().allApplications.find((a) => a.applicationId === id);
        }
        
        if (app) {
          const employee = mockEmployees.find((e) => e.employeeId === app!.employeeId);
          if (employee) {
            const parkingState = useParkingStore.getState();
            const assignment = assignParkingSpace(
              app!,
              employee,
              parkingState.zones,
              parkingState.spaces
            );

            if (assignment.success) {
              const assignResult = await parkingState.assignSpace({
                applicationId: app!.applicationId,
                zoneId: assignment.zoneId,
                spaceId: assignment.spaceId,
              });

              if (assignResult.success && assignResult.space) {
                app.status = 'approved';
                app.approvedDate = getCurrentTime();
                app.parkingZoneId = assignment.zoneId;
                app.parkingSpaceId = assignment.spaceId;
                app.spaceType = assignment.spaceType;

                const zone = parkingState.zones.find((z) => z.zoneId === assignment.zoneId);
                app.parkingZoneName = zone?.zoneName;
                app.parkingSpaceNumber = assignResult.space.spaceNumber;
              } else {
                app.status = 'waiting';
                const estimatedWait = await parkingState.findAvailableSpace(
                  app!.employeeId,
                  employee.positionLevel,
                  employee.department
                );
                app.estimatedWaitHours = estimatedWait.estimatedWaitHours || 24;
              }
            } else {
              app.status = 'waiting';
              app.estimatedWaitHours = assignment.estimatedWaitHours || 24;
            }
          } else {
            app.status = 'approved';
            app.approvedDate = getCurrentTime();
          }
        }

        set((state) => ({
          allApplications: state.allApplications.map((a) =>
            a.applicationId === id ? { ...app } : a
          ),
          allApplicationsFull: state.allApplicationsFull.map((a) =>
            a.applicationId === id ? { ...app } : a
          ),
          loading: false,
        }));

        return app || null;
      },

      rejectApplication: async (id: string, reason: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const app = mockApplications.find((a) => a.applicationId === id);
        if (app) {
          app.status = 'rejected';
          app.remark = reason;
        }

        set((state) => ({
          allApplications: state.allApplications.map((a) =>
            a.applicationId === id ? { ...a, status: 'rejected' as const, remark: reason } : a
          ),
          allApplicationsFull: state.allApplicationsFull.map((a) =>
            a.applicationId === id ? { ...a, status: 'rejected' as const, remark: reason } : a
          ),
          loading: false,
        }));
      },

      renewApplication: async (id: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newExpireDate = getDateAfterMonths(6);
        const app = mockApplications.find((a) => a.applicationId === id);
        if (app) {
          app.expireDate = newExpireDate;
          app.status = 'approved';
        }

        set((state) => ({
          myApplications: state.myApplications.map((a) =>
            a.applicationId === id ? { ...a, expireDate: newExpireDate, status: 'approved' as const } : a
          ),
          allApplications: state.allApplications.map((a) =>
            a.applicationId === id ? { ...a, expireDate: newExpireDate, status: 'approved' as const } : a
          ),
          allApplicationsFull: state.allApplicationsFull.map((a) =>
            a.applicationId === id ? { ...a, expireDate: newExpireDate, status: 'approved' as const } : a
          ),
          loading: false,
        }));
      },

      getApplicationById: (id: string) => {
        return get().allApplications.find((a) => a.applicationId === id) ||
          mockApplications.find((a) => a.applicationId === id);
      },
    }),
    {
      name: 'application-storage',
      partialize: (state) => ({
        myApplications: state.myApplications,
        allApplications: state.allApplications,
        allApplicationsFull: state.allApplicationsFull,
        waitingQueue: state.waitingQueue,
      }),
    }
  )
);
