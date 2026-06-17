export type UserRole = 'employee' | 'admin' | 'finance';

export interface Employee {
  employeeId: string;
  name: string;
  department: string;
  positionLevel: number;
  phone: string;
  role: UserRole;
  password?: string;
}

export interface Vehicle {
  plateNumber: string;
  employeeId: string;
  ownerName: string;
  vehicleType: string;
  engineNumber: string;
  registerDate: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'waiting';

export interface Application {
  applicationId: string;
  employeeId: string;
  employeeName?: string;
  plateNumber: string;
  vehicleType: string;
  ownerName: string;
  engineNumber: string;
  drivingLicenseImage?: string;
  status: ApplicationStatus;
  applyDate: string;
  approvedDate?: string;
  expireDate: string;
  parkingZoneId?: string;
  parkingZoneName?: string;
  parkingSpaceId?: string;
  parkingSpaceNumber?: string;
  spaceType?: 'fixed' | 'temporary';
  remark?: string;
  estimatedWaitHours?: number;
}

export interface ParkingZone {
  zoneId: string;
  zoneName: string;
  totalSpaces: number;
  usedSpaces: number;
  positionLevelRequired: number;
  departmentAllowed: string[];
  isFixed: boolean;
}

export type SpaceStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type SpaceType = 'fixed' | 'temporary';

export interface ParkingSpace {
  spaceId: string;
  zoneId: string;
  zoneName?: string;
  spaceNumber: string;
  status: SpaceStatus;
  spaceType: SpaceType;
  plateNumber?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface AccessRecord {
  recordId: string;
  plateNumber: string;
  employeeId?: string;
  employeeName?: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  overtimeMinutes?: number;
  expense?: number;
}

export type ExpenseStatus = 'pending' | 'deducted' | 'exempted';

export interface Expense {
  expenseId: string;
  employeeId: string;
  employeeName?: string;
  recordId: string;
  plateNumber: string;
  amount: number;
  overtimeMinutes: number;
  deductionDate: string;
  status: ExpenseStatus;
  salaryMonth?: string;
  entryTime?: string;
  exitTime?: string;
  createTime?: string;
  deductedTime?: string;
  exemptReason?: string;
  exemptTime?: string;
}

export interface SystemLog {
  logId: string;
  operatorId: string;
  operatorName: string;
  operationType: string;
  operateTime: string;
  detail: string;
  ipAddress?: string;
}

export type NotificationType = 'renewal' | 'approval' | 'parking' | 'overtime' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  employeeId: string;
  isRead: boolean;
  createTime: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatisticsResponse {
  zoneUsage: Array<{ zoneName: string; zoneId: string; usageRate: number; total: number; used: number }>;
  overtimeRate: number;
  avgWaitTime: number;
  totalApplications: number;
  pendingApplications: number;
  todayEntryCount: number;
  todayExitCount: number;
  totalAmountThisMonth: number;
  dailyTrend: Array<{ date: string; entryCount: number; exitCount: number }>;
  topOvertime: Array<{ plateNumber: string; employeeName: string; overtimeMinutes: number; count: number }>;
  departmentStats: Array<{ department: string; count: number; amount: number }>;
}

export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
}

export interface CreateApplicationRequest {
  plateNumber: string;
  vehicleType: string;
  ownerName: string;
  engineNumber: string;
  drivingLicenseImage?: string;
}

export interface AssignParkingRequest {
  applicationId: string;
  zoneId: string;
  spaceId: string;
}

export interface FeeResult {
  durationMinutes: number;
  overtimeMinutes: number;
  amount: number;
}

export interface AssignmentResult {
  success: boolean;
  inQueue?: boolean;
  zoneId?: string;
  spaceId?: string;
  spaceType?: 'fixed' | 'temporary';
  estimatedWaitHours?: number;
}
