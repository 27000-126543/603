import { create } from 'zustand';
import { StatisticsResponse } from '@/types';
import {
  mockParkingZones,
  mockAccessRecords,
  mockExpenses,
  mockApplications,
  mockEmployees,
} from '@/mock/data';
import { getLastNDays, getCurrentMonth } from '@/utils/date';
import { getUsageRate, getOvertimeRate } from '@/utils/business';
import { exportToExcel, exportToPDF, exportReportToPDF, ExportColumn } from '@/utils/export';
import { AccessRecord, Expense, Application, SystemLog } from '@/types';

interface ReportState {
  statistics: StatisticsResponse | null;
  loading: boolean;

  fetchStatistics: () => Promise<StatisticsResponse>;
  exportRecordsToExcel: (data: AccessRecord[]) => void;
  exportRecordsToPDF: (data: AccessRecord[]) => void;
  exportExpensesToExcel: (data: Expense[]) => void;
  exportExpensesToPDF: (data: Expense[]) => void;
  exportApplicationsToExcel: (data: Application[]) => void;
  exportLogsToExcel: (data: SystemLog[]) => void;
  exportStatisticsReport: () => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  statistics: null,
  loading: false,

  fetchStatistics: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const zoneUsage = mockParkingZones.map((zone) => ({
      zoneName: zone.zoneName,
      zoneId: zone.zoneId,
      usageRate: getUsageRate(zone.usedSpaces, zone.totalSpaces),
      total: zone.totalSpaces,
      used: zone.usedSpaces,
    }));

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = mockAccessRecords.filter((r) => r.entryTime.startsWith(today));
    const overtimeRecords = mockAccessRecords.filter((r) => (r.overtimeMinutes || 0) > 0);
    const currentMonth = getCurrentMonth();
    const monthExpenses = mockExpenses.filter((e) => e.salaryMonth === currentMonth);

    const dates = getLastNDays(7);
    const dailyTrend = dates.map((date) => ({
      date,
      entryCount: mockAccessRecords.filter((r) => r.entryTime.startsWith(date)).length,
      exitCount: mockAccessRecords.filter((r) => r.exitTime?.startsWith(date)).length,
    }));

    const overtimeMap = new Map<string, { employeeName: string; overtimeMinutes: number; count: number }>();
    overtimeRecords.forEach((record) => {
      const key = record.plateNumber;
      const current = overtimeMap.get(key) || { employeeName: record.employeeName || '', overtimeMinutes: 0, count: 0 };
      overtimeMap.set(key, {
        employeeName: current.employeeName || record.employeeName,
        overtimeMinutes: current.overtimeMinutes + (record.overtimeMinutes || 0),
        count: current.count + 1,
      });
    });

    const topOvertime = Array.from(overtimeMap.entries())
      .map(([plateNumber, stats]) => ({ plateNumber, ...stats }))
      .sort((a, b) => b.overtimeMinutes - a.overtimeMinutes)
      .slice(0, 5);

    const deptMap = new Map<string, { count: number; amount: number }>();
    monthExpenses.forEach((expense) => {
      const emp = mockEmployees.find((e) => e.employeeId === expense.employeeId);
      const dept = emp?.department || '未知';
      const current = deptMap.get(dept) || { count: 0, amount: 0 };
      deptMap.set(dept, {
        count: current.count + 1,
        amount: current.amount + expense.amount,
      });
    });

    const departmentStats = Array.from(deptMap.entries()).map(([department, stats]) => ({
      department,
      ...stats,
    }));

    const statistics: StatisticsResponse = {
      zoneUsage,
      overtimeRate: getOvertimeRate(mockAccessRecords.length, overtimeRecords.length),
      avgWaitTime: 45,
      totalApplications: mockApplications.length,
      pendingApplications: mockApplications.filter((a) => a.status === 'pending' || a.status === 'waiting').length,
      todayEntryCount: todayRecords.length,
      todayExitCount: todayRecords.filter((r) => r.exitTime).length,
      totalAmountThisMonth: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      dailyTrend,
      topOvertime,
      departmentStats,
    };

    set({ statistics, loading: false });
    return statistics;
  },

  exportRecordsToExcel: (data: AccessRecord[]) => {
    const columns: ExportColumn<AccessRecord>[] = [
      { key: 'recordId', title: '记录ID' },
      { key: 'plateNumber', title: '车牌号' },
      { key: 'employeeName', title: '员工姓名' },
      { key: 'entryTime', title: '入场时间' },
      { key: 'exitTime', title: '出场时间' },
      { key: 'durationMinutes', title: '停留时长(分钟)' },
      { key: 'overtimeMinutes', title: '超时时长(分钟)' },
      { key: 'expense', title: '费用(元)', format: (v) => `¥${Number(v || 0).toFixed(2)}` },
    ];
    exportToExcel(data, columns, `出入记录_${new Date().toISOString().split('T')[0]}`);
  },

  exportRecordsToPDF: (data: AccessRecord[]) => {
    const columns: ExportColumn<AccessRecord>[] = [
      { key: 'recordId', title: '记录ID' },
      { key: 'plateNumber', title: '车牌号' },
      { key: 'employeeName', title: '员工姓名' },
      { key: 'entryTime', title: '入场时间' },
      { key: 'exitTime', title: '出场时间' },
      { key: 'durationMinutes', title: '停留时长(分钟)' },
      { key: 'expense', title: '费用(元)', format: (v) => `¥${Number(v || 0).toFixed(2)}` },
    ];
    exportToPDF(data, columns, '出入记录报表', `出入记录_${new Date().toISOString().split('T')[0]}`);
  },

  exportExpensesToExcel: (data: Expense[]) => {
    const columns: ExportColumn<Expense>[] = [
      { key: 'expenseId', title: '费用ID' },
      { key: 'employeeName', title: '员工姓名' },
      { key: 'plateNumber', title: '车牌号' },
      { key: 'overtimeMinutes', title: '超时时长(分钟)' },
      { key: 'amount', title: '金额(元)', format: (v) => `¥${Number(v).toFixed(2)}` },
      { key: 'deductionDate', title: '扣费日期' },
      { key: 'status', title: '状态', format: (v) => {
        const map: Record<string, string> = { pending: '待扣除', deducted: '已扣除', exempted: '已减免' };
        return map[v as string] || String(v);
      }},
      { key: 'salaryMonth', title: '薪资月份' },
    ];
    exportToExcel(data, columns, `费用明细_${new Date().toISOString().split('T')[0]}`);
  },

  exportExpensesToPDF: (data: Expense[]) => {
    const columns: ExportColumn<Expense>[] = [
      { key: 'expenseId', title: '费用ID' },
      { key: 'employeeName', title: '员工姓名' },
      { key: 'plateNumber', title: '车牌号' },
      { key: 'overtimeMinutes', title: '超时时长(分钟)' },
      { key: 'amount', title: '金额(元)', format: (v) => `¥${Number(v).toFixed(2)}` },
      { key: 'deductionDate', title: '扣费日期' },
      { key: 'status', title: '状态', format: (v) => {
        const map: Record<string, string> = { pending: '待扣除', deducted: '已扣除', exempted: '已减免' };
        return map[v as string] || String(v);
      }},
    ];
    exportToPDF(data, columns, '费用明细报表', `费用明细_${new Date().toISOString().split('T')[0]}`);
  },

  exportApplicationsToExcel: (data: Application[]) => {
    const columns: ExportColumn<Application>[] = [
      { key: 'applicationId', title: '申请ID' },
      { key: 'employeeName', title: '申请人' },
      { key: 'plateNumber', title: '车牌号' },
      { key: 'vehicleType', title: '车辆类型' },
      { key: 'applyDate', title: '申请日期' },
      { key: 'status', title: '状态', format: (v) => {
        const map: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', expired: '已过期', waiting: '等待中' };
        return map[v as string] || String(v);
      }},
      { key: 'parkingZoneName', title: '停车区域' },
      { key: 'parkingSpaceNumber', title: '车位号' },
      { key: 'expireDate', title: '有效期至' },
    ];
    exportToExcel(data, columns, `申请记录_${new Date().toISOString().split('T')[0]}`);
  },

  exportLogsToExcel: (data: SystemLog[]) => {
    const columns: ExportColumn<SystemLog>[] = [
      { key: 'logId', title: '日志ID' },
      { key: 'operatorName', title: '操作人' },
      { key: 'operationType', title: '操作类型' },
      { key: 'operateTime', title: '操作时间' },
      { key: 'detail', title: '操作详情' },
      { key: 'ipAddress', title: 'IP地址' },
    ];
    exportToExcel(data, columns, `系统日志_${new Date().toISOString().split('T')[0]}`);
  },

  exportStatisticsReport: () => {
    const stats = get().statistics;
    if (stats) {
      exportReportToPDF(stats, stats.dailyTrend, `统计报告_${new Date().toISOString().split('T')[0]}`);
    }
  },
}));
