import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';

export const usePermission = () => {
  const { currentUser } = useAuthStore();

  const hasRole = useMemo(() => {
    return (roles: UserRole[]) => {
      if (!currentUser) return false;
      return roles.includes(currentUser.role);
    };
  }, [currentUser]);

  const isEmployee = useMemo(() => currentUser?.role === 'employee', [currentUser]);
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);
  const isFinance = useMemo(() => currentUser?.role === 'finance', [currentUser]);

  const canViewAllRecords = useMemo(() => {
    return isAdmin || isFinance;
  }, [isAdmin, isFinance]);

  const canManageParking = useMemo(() => {
    return isAdmin;
  }, [isAdmin]);

  const canViewFinance = useMemo(() => {
    return isAdmin || isFinance;
  }, [isAdmin, isFinance]);

  const canApproveApplication = useMemo(() => {
    return isAdmin;
  }, [isAdmin]);

  const canExportData = useMemo(() => {
    return isAdmin || isFinance;
  }, [isAdmin, isFinance]);

  const canViewLogs = useMemo(() => {
    return isAdmin;
  }, [isAdmin]);

  return {
    hasRole,
    isEmployee,
    isAdmin,
    isFinance,
    canViewAllRecords,
    canManageParking,
    canViewFinance,
    canApproveApplication,
    canExportData,
    canViewLogs,
  };
};
