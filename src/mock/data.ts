import {
  Employee,
  Application,
  ParkingZone,
  ParkingSpace,
  AccessRecord,
  Expense,
  SystemLog,
  Notification,
} from '@/types';
import { generateId } from '@/utils/format';
import { getCurrentTime, getDateBeforeDays, getDateAfterMonths, getLastNDays } from '@/utils/date';

export const mockEmployees: Employee[] = [
  { employeeId: 'E001', name: '张三', department: '技术部', positionLevel: 3, phone: '13800138001', role: 'employee', password: '123456' },
  { employeeId: 'E002', name: '李四', department: '技术部', positionLevel: 5, phone: '13800138002', role: 'admin', password: '123456' },
  { employeeId: 'E003', name: '王五', department: '财务部', positionLevel: 4, phone: '13800138003', role: 'finance', password: '123456' },
  { employeeId: 'E004', name: '赵六', department: '产品部', positionLevel: 2, phone: '13800138004', role: 'employee', password: '123456' },
  { employeeId: 'E005', name: '钱七', department: '市场部', positionLevel: 3, phone: '13800138005', role: 'employee', password: '123456' },
  { employeeId: 'E006', name: '孙八', department: '人力资源部', positionLevel: 4, phone: '13800138006', role: 'employee', password: '123456' },
  { employeeId: 'E007', name: '周九', department: '技术部', positionLevel: 6, phone: '13800138007', role: 'employee', password: '123456' },
  { employeeId: 'E008', name: '吴十', department: '产品部', positionLevel: 3, phone: '13800138008', role: 'employee', password: '123456' },
];

export const mockParkingZones: ParkingZone[] = [
  { zoneId: 'Z001', zoneName: 'A区（高管固定车位）', totalSpaces: 20, usedSpaces: 15, positionLevelRequired: 5, departmentAllowed: [], isFixed: true },
  { zoneId: 'Z002', zoneName: 'B区（技术部临时车位）', totalSpaces: 50, usedSpaces: 48, positionLevelRequired: 1, departmentAllowed: ['技术部'], isFixed: false },
  { zoneId: 'Z003', zoneName: 'C区（公共临时车位）', totalSpaces: 100, usedSpaces: 85, positionLevelRequired: 1, departmentAllowed: [], isFixed: false },
];

const generateParkingSpaces = (): ParkingSpace[] => {
  const spaces: ParkingSpace[] = [];
  let num = 1;

  for (let z = 0; z < mockParkingZones.length; z++) {
    const zone = mockParkingZones[z];
    for (let i = 1; i <= zone.totalSpaces; i++) {
      const isUsed = i <= zone.usedSpaces;
      const empIdx = (i + z) % mockEmployees.length;
      spaces.push({
        spaceId: `S${String(num).padStart(4, '0')}`,
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        spaceNumber: `${zone.zoneId.charAt(1)}${String(i).padStart(3, '0')}`,
        status: isUsed ? 'occupied' : 'available',
        spaceType: zone.isFixed ? 'fixed' : 'temporary',
        plateNumber: isUsed ? `京A${String(10000 + num)}` : undefined,
        employeeId: isUsed ? mockEmployees[empIdx].employeeId : undefined,
        employeeName: isUsed ? mockEmployees[empIdx].name : undefined,
      });
      num++;
    }
  }
  return spaces;
};

export const mockParkingSpaces: ParkingSpace[] = generateParkingSpaces();

const generateApplications = (): Application[] => {
  const apps: Application[] = [];
  const statuses: Application['status'][] = ['approved', 'pending', 'waiting', 'expired', 'rejected'];

  for (let i = 0; i < 25; i++) {
    const emp = mockEmployees[i % mockEmployees.length];
    const status = statuses[i % 5];
    const space = mockParkingSpaces.find((s) => s.employeeId === emp.employeeId);

    apps.push({
      applicationId: `APP${String(i + 1).padStart(6, '0')}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      plateNumber: `京A${String(10000 + i)}`,
      vehicleType: i % 2 === 0 ? '轿车' : 'SUV',
      ownerName: emp.name,
      engineNumber: `ENG${String(100000 + i)}`,
      status,
      applyDate: getDateBeforeDays(Math.floor(Math.random() * 30)),
      approvedDate: status === 'approved' ? getDateBeforeDays(Math.floor(Math.random() * 28)) : undefined,
      expireDate: getDateAfterMonths(6),
      parkingZoneId: space?.zoneId,
      parkingZoneName: space?.zoneName,
      parkingSpaceId: space?.spaceId,
      parkingSpaceNumber: space?.spaceNumber,
      spaceType: space?.spaceType,
      estimatedWaitHours: status === 'waiting' ? Math.floor(Math.random() * 72) + 24 : undefined,
    });
  }
  return apps;
};

export const mockApplications: Application[] = generateApplications();

const generateAccessRecords = (): AccessRecord[] => {
  const records: AccessRecord[] = [];
  const dates = getLastNDays(14);

  for (let i = 0; i < 100; i++) {
    const date = dates[Math.floor(Math.random() * dates.length)];
    const emp = mockEmployees[i % mockEmployees.length];
    const entryHour = 7 + Math.floor(Math.random() * 3);
    const exitHour = 17 + Math.floor(Math.random() * 4);
    const overtime = Math.random() > 0.7 ? Math.floor(Math.random() * 120) : 0;
    const duration = (exitHour - entryHour) * 60 + Math.floor(Math.random() * 30) + overtime;

    records.push({
      recordId: `REC${String(i + 1).padStart(6, '0')}`,
      plateNumber: `京A${String(10000 + (i % 25))}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      entryTime: `${date} ${String(entryHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      exitTime: `${date} ${String(exitHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      durationMinutes: duration,
      overtimeMinutes: overtime,
      expense: overtime > 0 ? Math.round(overtime * 0.1 * 100) / 100 : 0,
    });
  }
  return records.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
};

export const mockAccessRecords: AccessRecord[] = generateAccessRecords();

const generateExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  const overtimeRecords = mockAccessRecords.filter((r) => r.overtimeMinutes && r.overtimeMinutes > 0);

  overtimeRecords.forEach((record, idx) => {
    expenses.push({
      expenseId: `EXP${String(idx + 1).padStart(6, '0')}`,
      employeeId: record.employeeId || 'E001',
      employeeName: record.employeeName,
      recordId: record.recordId,
      plateNumber: record.plateNumber,
      amount: record.expense || 0,
      overtimeMinutes: record.overtimeMinutes || 0,
      deductionDate: record.exitTime || getCurrentTime(),
      status: idx % 3 === 0 ? 'pending' : idx % 3 === 1 ? 'deducted' : 'exempted',
      salaryMonth: '2026-06',
    });
  });
  return expenses;
};

export const mockExpenses: Expense[] = generateExpenses();

const generateSystemLogs = (): SystemLog[] => {
  const logs: SystemLog[] = [];
  const operations = [
    { type: '用户登录', detail: '用户登录系统' },
    { type: '提交申请', detail: '提交车辆通行证申请' },
    { type: '审核申请', detail: '审批通过通行证申请' },
    { type: '拒绝申请', detail: '拒绝通行证申请' },
    { type: '分配车位', detail: '分配停车位' },
    { type: '调整停车位', detail: '调整停车位' },
    { type: '续期提醒', detail: '发送续期提醒' },
    { type: '冻结通行权限', detail: '冻结通行权限' },
    { type: '费用扣除', detail: '执行费用扣除' },
    { type: '导出报表', detail: '导出Excel报表' },
    { type: '导出报表', detail: '导出PDF报表' },
    { type: '修改系统配置', detail: '修改系统配置' },
  ];

  const getExtraFields = (type: string, index: number): { targetType: string; targetId: string; resultStatus: string; remark?: string } => {
    switch (type) {
      case '审核申请':
      case '拒绝申请':
        return { targetType: 'application', targetId: `APP${String((index % 25) + 1).padStart(6, '0')}`, resultStatus: 'success' };
      case '提交申请':
        return { targetType: 'application', targetId: `APP${String((index % 25) + 1).padStart(6, '0')}`, resultStatus: 'success' };
      case '新增停车区域':
      case '修改停车区域':
      case '删除停车区域':
        return { targetType: 'parkingZone', targetId: `ZONE${String((index % 10) + 1).padStart(4, '0')}`, resultStatus: 'success' };
      case '费用扣除':
      case '单条扣费':
      case '批量扣费':
        return { targetType: 'expense', targetId: `EXP${String((index % 30) + 1).padStart(6, '0')}`, resultStatus: 'success' };
      case '分配车位':
        return { targetType: 'parkingSpace', targetId: `SP${String((index % 170) + 1).padStart(4, '0')}`, resultStatus: 'success' };
      case '车辆入场':
      case '车辆出场':
        return { targetType: 'accessRecord', targetId: `REC${String((index % 100) + 1).padStart(6, '0')}`, resultStatus: 'success' };
      case '用户登录':
        return { targetType: 'system', targetId: '', resultStatus: 'success', remark: '登录成功' };
      default:
        return { targetType: 'system', targetId: '', resultStatus: 'success' };
    }
  };

  for (let i = 0; i < 80; i++) {
    const op = operations[i % operations.length];
    const emp = mockEmployees[i % mockEmployees.length];
    const extra = getExtraFields(op.type, i);
    logs.push({
      logId: `LOG${String(i + 1).padStart(8, '0')}`,
      operatorId: emp.employeeId,
      operatorName: emp.name,
      operationType: op.type,
      operateTime: getDateBeforeDays(Math.floor(Math.random() * 30)) + ' ' +
        String(Math.floor(Math.random() * 24)).padStart(2, '0') + ':' +
        String(Math.floor(Math.random() * 60)).padStart(2, '0') + ':' +
        String(Math.floor(Math.random() * 60)).padStart(2, '0'),
      detail: op.detail,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      targetId: extra.targetId,
      targetType: extra.targetType,
      resultStatus: extra.resultStatus,
      remark: extra.remark,
    });
  }
  return logs.sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
};

export const mockSystemLogs: SystemLog[] = generateSystemLogs();

const generateNotifications = (): Notification[] => {
  const notifications: Notification[] = [];
  const types: Notification['type'][] = ['renewal', 'approval', 'parking', 'overtime', 'system'];
  const typeTitles: Record<string, string> = {
    renewal: '通行证续期提醒',
    approval: '申请审批结果',
    parking: '车位分配通知',
    overtime: '停车超时警告',
    system: '系统通知',
  };

  for (let i = 0; i < 15; i++) {
    const type = types[i % 5];
    const emp = mockEmployees[i % mockEmployees.length];
    const contents: Record<string, string> = {
      renewal: `您的通行证将于7天后到期，请及时办理续期手续。`,
      approval: `您的通行证申请已审批通过，有效期6个月。`,
      parking: `您已成功分配到${mockParkingZones[i % 3].zoneName}的车位。`,
      overtime: `您昨日停车超时35分钟，产生费用3.50元，将从当月工资扣除。`,
      system: `系统将于本周五22:00-24:00进行维护升级，请提前做好相关安排。`,
    };

    notifications.push({
      id: generateId('NOTIF'),
      type,
      title: typeTitles[type],
      content: contents[type],
      employeeId: emp.employeeId,
      isRead: i > 8,
      createTime: getDateBeforeDays(Math.floor(Math.random() * 7)) + ' ' +
        String(Math.floor(Math.random() * 24)).padStart(2, '0') + ':' +
        String(Math.floor(Math.random() * 60)).padStart(2, '0') + ':00',
    });
  }
  return notifications.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
};

export const mockNotifications: Notification[] = generateNotifications();

export const getMockData = () => ({
  employees: mockEmployees,
  applications: mockApplications,
  parkingZones: mockParkingZones,
  parkingSpaces: mockParkingSpaces,
  accessRecords: mockAccessRecords,
  expenses: mockExpenses,
  systemLogs: mockSystemLogs,
  notifications: mockNotifications,
});
