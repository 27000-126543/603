import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParkingZone, ParkingSpace, AssignParkingRequest } from '@/types';
import { mockParkingZones, mockParkingSpaces, mockApplications } from '@/mock/data';
import { getCurrentTime, generateId } from '@/utils/format';

interface ParkingState {
  zones: ParkingZone[];
  spaces: ParkingSpace[];
  selectedZoneId: string | null;
  loading: boolean;
  error: string | null;

  fetchZones: () => Promise<void>;
  fetchSpaces: (zoneId?: string) => Promise<void>;
  setSelectedZone: (zoneId: string | null) => void;
  assignSpace: (data: AssignParkingRequest) => Promise<{ success: boolean; space?: ParkingSpace }>;
  releaseSpace: (spaceId: string) => Promise<void>;
  updateSpaceStatus: (spaceId: string, status: ParkingSpace['status']) => Promise<void>;
  addZone: (zone: Omit<ParkingZone, 'zoneId' | 'usedSpaces'>) => Promise<ParkingZone>;
  updateZone: (zoneId: string, updates: Partial<ParkingZone>) => Promise<ParkingZone | null>;
  deleteZone: (zoneId: string) => Promise<boolean>;
  findAvailableSpace: (employeeId: string, positionLevel: number, department: string) => Promise<{
    available: boolean;
    space?: ParkingSpace;
    zone?: ParkingZone;
    estimatedWaitHours?: number;
  }>;
}

export const useParkingStore = create<ParkingState>()(
  persist(
    (set, get) => ({
      zones: [...mockParkingZones],
      spaces: [...mockParkingSpaces],
      selectedZoneId: null,
      loading: false,
      error: null,

      fetchZones: async () => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ loading: false });
      },

      fetchSpaces: async (zoneId?: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ selectedZoneId: zoneId || null, loading: false });
      },

      setSelectedZone: (zoneId: string | null) => {
        set({ selectedZoneId: zoneId });
      },

      findAvailableSpace: async (employeeId: string, positionLevel: number, department: string) => {
        const { zones, spaces } = get();
        
        const eligibleZones = zones.filter(zone => 
          positionLevel >= zone.positionLevelRequired &&
          (zone.departmentAllowed.length === 0 || zone.departmentAllowed.includes(department))
        );

        for (const zone of eligibleZones) {
          const zoneSpaces = spaces.filter(s => s.zoneId === zone.zoneId);
          const availableSpace = zoneSpaces.find(s => s.status === 'available');
          
          if (availableSpace) {
            return {
              available: true,
              space: availableSpace,
              zone,
            };
          }
        }

        const totalEligibleSpaces = eligibleZones.reduce((sum, z) => sum + z.totalSpaces, 0);
        const totalUsedSpaces = eligibleZones.reduce((sum, z) => sum + z.usedSpaces, 0);
        const occupancyRate = totalEligibleSpaces > 0 ? totalUsedSpaces / totalEligibleSpaces : 1;
        
        if (occupancyRate < 0.9) {
          const estimatedWaitHours = Math.ceil((1 - occupancyRate) * 24);
          return {
            available: false,
            estimatedWaitHours,
          };
        } else {
          const estimatedWaitHours = Math.ceil((occupancyRate - 0.8) * 72);
          return {
            available: false,
            estimatedWaitHours: Math.min(estimatedWaitHours, 168),
          };
        }
      },

      assignSpace: async (data: AssignParkingRequest) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const state = get();
        const space = state.spaces.find((s) => s.spaceId === data.spaceId);
        const app = mockApplications.find((a) => a.applicationId === data.applicationId);

        if (!space || space.status !== 'available') {
          set({ loading: false, error: space ? '车位已被占用' : '车位不存在' });
          return { success: false };
        }

        const updatedSpace = {
          ...space,
          status: 'occupied' as const,
          employeeId: app?.employeeId,
          employeeName: app?.employeeName,
          plateNumber: app?.plateNumber,
        };

        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.spaceId === data.spaceId ? updatedSpace : s
          ),
          zones: state.zones.map((z) =>
            z.zoneId === data.zoneId
              ? { ...z, usedSpaces: z.usedSpaces + 1 }
              : z
          ),
          loading: false,
        }));

        if (app) {
          app.parkingZoneId = data.zoneId;
          app.parkingSpaceId = data.spaceId;
          app.status = 'approved';
          app.approvedDate = getCurrentTime();

          const zone = get().zones.find((z) => z.zoneId === data.zoneId);
          if (zone) {
            app.parkingZoneName = zone.zoneName;
            app.spaceType = zone.isFixed ? 'fixed' : 'temporary';
          }
          app.parkingSpaceNumber = updatedSpace.spaceNumber;
        }

        return { success: true, space: updatedSpace };
      },

      releaseSpace: async (spaceId: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const state = get();
        let space = state.spaces.find((s) => s.spaceId === spaceId);
        
        if (!space) {
          space = mockParkingSpaces.find((s) => s.spaceId === spaceId);
        }

        if (space) {
          set((state) => ({
            spaces: state.spaces.map((s) =>
              s.spaceId === spaceId
                ? { ...s, status: 'available' as const, employeeId: undefined, employeeName: undefined, plateNumber: undefined }
                : s
            ),
            zones: state.zones.map((z) =>
              z.zoneId === space?.zoneId
                ? { ...z, usedSpaces: Math.max(z.usedSpaces - 1, 0) }
                : z
            ),
            loading: false,
          }));

          const mockSpace = mockParkingSpaces.find((s) => s.spaceId === spaceId);
          if (mockSpace) {
            mockSpace.status = 'available';
            mockSpace.employeeId = undefined;
            mockSpace.employeeName = undefined;
            mockSpace.plateNumber = undefined;
            const zone = mockParkingZones.find((z) => z.zoneId === mockSpace.zoneId);
            if (zone) {
              zone.usedSpaces = Math.max(zone.usedSpaces - 1, 0);
            }
          }
        } else {
          set({ loading: false });
        }
      },

      updateSpaceStatus: async (spaceId: string, status: ParkingSpace['status']) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.spaceId === spaceId ? { ...s, status } : s
          ),
          loading: false,
        }));

        const mockSpace = mockParkingSpaces.find((s) => s.spaceId === spaceId);
        if (mockSpace) {
          mockSpace.status = status;
        }
      },

      addZone: async (zoneData) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newZone: ParkingZone = {
          zoneId: generateId('Z').slice(0, 6).toUpperCase(),
          zoneName: zoneData.zoneName,
          totalSpaces: zoneData.totalSpaces,
          usedSpaces: 0,
          positionLevelRequired: zoneData.positionLevelRequired,
          departmentAllowed: zoneData.departmentAllowed,
          isFixed: zoneData.isFixed,
        };

        const newSpaces: ParkingSpace[] = Array.from({ length: zoneData.totalSpaces }, (_, i) => ({
          spaceId: `${newZone.zoneId}-${String(i + 1).padStart(3, '0')}`,
          zoneId: newZone.zoneId,
          zoneName: newZone.zoneName,
          spaceNumber: `${newZone.zoneId}${String(i + 1).padStart(3, '0')}`,
          status: 'available' as const,
          spaceType: zoneData.isFixed ? 'fixed' as const : 'temporary' as const,
        }));

        set((state) => ({
          zones: [...state.zones, newZone],
          spaces: [...state.spaces, ...newSpaces],
          loading: false,
        }));

        mockParkingZones.push(newZone);
        mockParkingSpaces.push(...newSpaces);

        return newZone;
      },

      updateZone: async (zoneId, updates) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        let updatedZone: ParkingZone | null = null;
        let newSpaces: ParkingSpace[] = [];

        set((state) => {
          const currentZone = state.zones.find((z) => z.zoneId === zoneId);
          if (!currentZone) {
            return { loading: false };
          }

          updatedZone = { ...currentZone, ...updates };
          
          let updatedZones = state.zones.map((z) =>
            z.zoneId === zoneId ? updatedZone! : z
          );

          let updatedSpaces = state.spaces.map((s) =>
            s.zoneId === zoneId
              ? { ...s, zoneName: updatedZone!.zoneName }
              : s
          );

          if (updates.totalSpaces !== undefined && updates.totalSpaces !== currentZone.totalSpaces) {
            const oldTotal = currentZone.totalSpaces;
            const newTotal = updates.totalSpaces;

            if (newTotal > oldTotal) {
              const addCount = newTotal - oldTotal;
              const newSpaceList: ParkingSpace[] = [];
              for (let i = 0; i < addCount; i++) {
                const spaceNum = oldTotal + i + 1;
                newSpaceList.push({
                  spaceId: `${zoneId}-${String(spaceNum).padStart(3, '0')}`,
                  zoneId: zoneId,
                  zoneName: updatedZone!.zoneName,
                  spaceNumber: `${zoneId}${String(spaceNum).padStart(3, '0')}`,
                  status: 'available' as const,
                  spaceType: updatedZone!.isFixed ? 'fixed' as const : 'temporary' as const,
                });
              }
              updatedSpaces = [...updatedSpaces, ...newSpaceList];
              newSpaces = newSpaceList;
            } else if (newTotal < oldTotal) {
              const removeCount = oldTotal - newTotal;
              const zoneSpaces = updatedSpaces.filter((s) => s.zoneId === zoneId);
              const availableSpaces = zoneSpaces.filter((s) => s.status === 'available');
              
              if (availableSpaces.length >= removeCount) {
                const toRemove = availableSpaces.slice(0, removeCount);
                const toRemoveIds = new Set(toRemove.map((s) => s.spaceId));
                updatedSpaces = updatedSpaces.filter((s) => !toRemoveIds.has(s.spaceId));
              } else {
                updatedZone = { ...updatedZone!, totalSpaces: oldTotal };
                updatedZones = updatedZones.map((z) =>
                  z.zoneId === zoneId ? updatedZone! : z
                );
              }
            }
          }

          return {
            zones: updatedZones,
            spaces: updatedSpaces,
            loading: false,
          };
        });

        if (updatedZone) {
          const mockZoneIndex = mockParkingZones.findIndex((z) => z.zoneId === zoneId);
          if (mockZoneIndex >= 0) {
            mockParkingZones[mockZoneIndex] = updatedZone;
          }

          mockParkingSpaces.forEach((s) => {
            if (s.zoneId === zoneId) {
              s.zoneName = updatedZone!.zoneName;
            }
          });

          if (newSpaces.length > 0) {
            mockParkingSpaces.push(...newSpaces);
          }
        }

        return updatedZone;
      },

      deleteZone: async (zoneId) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        set((state) => ({
          zones: state.zones.filter((z) => z.zoneId !== zoneId),
          spaces: state.spaces.filter((s) => s.zoneId !== zoneId),
          loading: false,
        }));

        const mockZoneIndex = mockParkingZones.findIndex((z) => z.zoneId === zoneId);
        if (mockZoneIndex >= 0) {
          mockParkingZones.splice(mockZoneIndex, 1);
        }

        const mockSpaceIndices: number[] = [];
        mockParkingSpaces.forEach((s, i) => {
          if (s.zoneId === zoneId) {
            mockSpaceIndices.push(i);
          }
        });
        mockSpaceIndices.reverse().forEach((i) => {
          mockParkingSpaces.splice(i, 1);
        });

        return true;
      },
    }),
    {
      name: 'parking-storage',
      partialize: (state) => ({
        zones: state.zones,
        spaces: state.spaces,
      }),
    }
  )
);
