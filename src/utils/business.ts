import { Employee, ParkingZone, ParkingSpace, Application, FeeResult, AssignmentResult } from '@/types';
import { getMinutesBetween, getDateAfterMonths } from './date';
import { getCurrentTime, generateId } from './format';
import { formatPlateNumber } from './format';

export const calculateParkingFee = (entryTime: string, exitTime: string): FeeResult => {
  const FREE_HOURS = 8;
  const RATE_PER_MINUTE = 0.1;

  const durationMinutes = getMinutesBetween(entryTime, exitTime);
  const freeMinutes = FREE_HOURS * 60;

  if (durationMinutes <= freeMinutes) {
    return {
      durationMinutes,
      overtimeMinutes: 0,
      amount: 0,
    };
  }

  const overtimeMinutes = durationMinutes - freeMinutes;
  const amount = Math.round(overtimeMinutes * RATE_PER_MINUTE * 100) / 100;

  return {
    durationMinutes,
    overtimeMinutes,
    amount,
  };
};

export const validateDrivingLicense = (
  ownerName: string,
  employeeName: string,
  plateNumber: string
): { valid: boolean; message: string } => {
  if (!ownerName || !employeeName || !plateNumber) {
    return { valid: false, message: '请填写完整信息' };
  }

  if (ownerName !== employeeName) {
    return { valid: false, message: '行驶证所有人与员工姓名不一致' };
  }

  if (!formatPlateNumber(plateNumber)) {
    return { valid: false, message: '车牌号格式不正确' };
  }

  return { valid: true, message: '校验通过' };
};

export const assignParkingSpace = (
  application: Application,
  employee: Employee,
  zones: ParkingZone[],
  spaces: ParkingSpace[]
): AssignmentResult => {
  const eligibleZones = zones.filter((zone) => {
    const levelMatch = employee.positionLevel >= zone.positionLevelRequired;
    const deptMatch =
      zone.departmentAllowed.length === 0 ||
      zone.departmentAllowed.includes(employee.department);
    return levelMatch && deptMatch;
  });

  const sortedZones = [...eligibleZones].sort((a, b) => {
    if (a.isFixed && !b.isFixed) return -1;
    if (!a.isFixed && b.isFixed) return 1;
    return a.usedSpaces / a.totalSpaces - b.usedSpaces / b.totalSpaces;
  });

  for (const zone of sortedZones) {
    const availableSpace = spaces.find(
      (space) => space.zoneId === zone.zoneId && space.status === 'available'
    );
    if (availableSpace) {
      return {
        success: true,
        zoneId: zone.zoneId,
        spaceId: availableSpace.spaceId,
        spaceType: zone.isFixed ? 'fixed' : 'temporary',
      };
    }
  }

  const allUsed = zones.reduce((acc, z) => acc + z.usedSpaces, 0);
  const allTotal = zones.reduce((acc, z) => acc + z.totalSpaces, 0);
  const usageRate = allUsed / allTotal;
  const estimatedWaitHours = Math.ceil((usageRate * 24) + Math.random() * 12);

  return {
    success: false,
    inQueue: true,
    estimatedWaitHours,
  };
};

export const generateApplication = (
  employeeId: string,
  employeeName: string,
  data: {
    plateNumber: string;
    vehicleType: string;
    ownerName: string;
    engineNumber: string;
  }
): Application => {
  return {
    applicationId: generateId('APP'),
    employeeId,
    employeeName,
    plateNumber: formatPlateNumber(data.plateNumber),
    vehicleType: data.vehicleType,
    ownerName: data.ownerName,
    engineNumber: data.engineNumber,
    status: 'pending',
    applyDate: getCurrentTime(),
    expireDate: getDateAfterMonths(6),
    remark: '',
  };
};

export const calculateEstimatedWait = (waitingCount: number, dailyReleaseRate: number): number => {
  if (dailyReleaseRate === 0) return 72;
  return Math.ceil((waitingCount / dailyReleaseRate) * 24);
};

export const shouldRenew = (expireDate: string, daysBefore: number = 7): boolean => {
  const expire = new Date(expireDate);
  const now = new Date();
  const diff = expire.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return daysLeft >= 0 && daysLeft <= daysBefore;
};

export const shouldFreeze = (expireDate: string): boolean => {
  const expire = new Date(expireDate);
  const now = new Date();
  return now > expire;
};

export const getUsageRate = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((used / total) * 10000) / 100;
};

export const getOvertimeRate = (totalRecords: number, overtimeRecords: number): number => {
  if (totalRecords === 0) return 0;
  return Math.round((overtimeRecords / totalRecords) * 10000) / 100;
};
