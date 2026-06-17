import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, LoginRequest, LoginResponse } from '@/types';
import { mockEmployees } from '@/mock/data';
import { generateId, getCurrentTime } from '@/utils/format';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: Employee | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      token: null,
      loading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ loading: true, error: null });
        await new Promise((resolve) => setTimeout(resolve, 800));

        const employee = mockEmployees.find(
          (e) => e.employeeId === data.employeeId && e.password === data.password
        );

        if (!employee) {
          const error = '工号或密码错误';
          set({ loading: false, error });
          throw new Error(error);
        }

        const { password, ...userWithoutPassword } = employee;
        const token = generateId('TOKEN');

        set({
          isAuthenticated: true,
          currentUser: userWithoutPassword,
          token,
          loading: false,
        });

        return { token, employee: userWithoutPassword };
      },

      logout: () => {
        set({
          isAuthenticated: false,
          currentUser: null,
          token: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        token: state.token,
      }),
    }
  )
);
