import { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Building2,
  Users,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useReportStore } from '@/store/useReportStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatCard } from '@/components/ui/StatCard';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  exportToExcel,
} from '@/utils/format';
import { getLastNDays, getCurrentMonth } from '@/utils/date';

export default function ReportOverview() {
  const { currentUser } = useAuthStore();
  const { canViewFinance } = usePermission();
  const { statistics, loading, fetchStatistics, exportStatisticsReport } = useReportStore();
  const { addLog } = useLogStore();

  const [dateRange, setDateRange] = useState({
    startDate: getLastNDays(30)[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    await fetchStatistics();
  };

  const handleExportPDF = () => {
    if (!currentUser) return;
    exportStatisticsReport();
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出报表',
      detail: '导出统计报告PDF',
    });
  };

  const handleExportExcel = () => {
    if (!currentUser || !statistics) return;

    const exportData = {
      '总体概览': [
        { '统计项': '总停车位数', '数值': statistics.zoneUsage.reduce((s, z) => s + z.total, 0) },
        { '统计项': '已使用车位', '数值': statistics.zoneUsage.reduce((s, z) => s + z.used, 0) },
        { '统计项': '总体使用率', '数值': `${((statistics.zoneUsage.reduce((s, z) => s + z.used, 0) / statistics.zoneUsage.reduce((s, z) => s + z.total, 0)) * 100).toFixed(1)}%` },
        { '统计项': '超时比例', '数值': `${statistics.overtimeRate}%` },
        { '统计项': '平均等待时长', '数值': formatDuration(statistics.avgWaitTime) },
        { '统计项': '今日入场', '数值': statistics.todayEntryCount },
        { '统计项': '今日出场', '数值': statistics.todayExitCount },
        { '统计项': '本月总费用', '数值': formatCurrency(statistics.totalAmountThisMonth) },
      ],
      '各区域使用情况': statistics.zoneUsage.map(z => ({
        '区域名称': z.zoneName,
        '总车位': z.total,
        '已使用': z.used,
        '使用率': `${z.usageRate}%`,
      })),
      '超时排行榜': statistics.topOvertime.map(t => ({
        '车牌号': t.plateNumber,
        '员工姓名': t.employeeName,
        '超时次数': t.count,
        '总超时时长': formatDuration(t.overtimeMinutes),
      })),
      '各部门费用统计': statistics.departmentStats.map(d => ({
        '部门': d.department,
        '超时次数': d.count,
        '总费用': formatCurrency(d.amount),
      })),
    };

    exportToExcel(exportData, `统计报告_${dateRange.startDate}_${dateRange.endDate}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出报表',
      detail: '导出统计报告Excel',
    });
  };

  if (loading || !statistics) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const zoneUsageOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: statistics.zoneUsage.map(z => ({
          value: z.used,
          name: z.zoneName,
        })),
        color: ['#3B82F6', '#10B981', '#F59E0B'],
      },
    ],
  };

  const dailyTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['入场', '出场'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: statistics.dailyTrend.map(d => d.date.slice(5)),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '入场',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.3 },
        data: statistics.dailyTrend.map(d => d.entryCount),
        color: '#3B82F6',
      },
      {
        name: '出场',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.3 },
        data: statistics.dailyTrend.map(d => d.exitCount),
        color: '#10B981',
      },
    ],
  };

  const departmentOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: statistics.departmentStats.map(d => d.department),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '费用金额',
        type: 'bar',
        data: statistics.departmentStats.map(d => d.amount),
        itemStyle: {
          color: '#8B5CF6',
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  const overtimeTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['超时次数', '超时时长(分钟)'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: statistics.topOvertime.map(t => t.plateNumber),
    },
    yAxis: [
      {
        type: 'value',
        name: '次数',
      },
      {
        type: 'value',
        name: '时长(分钟)',
      },
    ],
    series: [
      {
        name: '超时次数',
        type: 'bar',
        yAxisIndex: 0,
        data: statistics.topOvertime.map(t => t.count),
        itemStyle: {
          color: '#F59E0B',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: '超时时长(分钟)',
        type: 'line',
        yAxisIndex: 1,
        data: statistics.topOvertime.map(t => t.overtimeMinutes),
        color: '#EF4444',
        smooth: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            统计报表
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看停车场运营数据和趋势分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStatistics}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw size={18} />
            刷新
          </button>
          <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={18} />
            导出Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-primary flex items-center gap-2"
          >
            <FileText size={18} />
            导出PDF
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              统计周期：
            </span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input w-36 text-sm"
            />
            <span className="text-neutral-500">至</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input w-36 text-sm"
            />
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            报告生成时间：{formatDate(new Date().toISOString())} {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总体使用率"
          value={`${((statistics.zoneUsage.reduce((s, z) => s + z.used, 0) / statistics.zoneUsage.reduce((s, z) => s + z.total, 0)) * 100).toFixed(1)}%`}
          icon={<Car size={24} />}
          trend="up"
          trendValue="2.3%"
          iconBg="bg-primary-100 dark:bg-primary-900/30"
          iconColor="text-primary-600"
        />
        <StatCard
          title="超时比例"
          value={`${statistics.overtimeRate}%`}
          icon={<AlertTriangle size={24} />}
          trend="down"
          trendValue="1.5%"
          iconBg="bg-warning-100 dark:bg-warning-900/30"
          iconColor="text-warning-600"
        />
        <StatCard
          title="平均等待时长"
          value={formatDuration(statistics.avgWaitTime)}
          icon={<Clock size={24} />}
          trend="down"
          trendValue="10分钟"
          iconBg="bg-success-100 dark:bg-success-900/30"
          iconColor="text-success-600"
        />
        <StatCard
          title="本月总费用"
          value={formatCurrency(statistics.totalAmountThisMonth)}
          icon={<TrendingUp size={24} />}
          trend="up"
          trendValue="8.7%"
          iconBg="bg-danger-100 dark:bg-danger-900/30"
          iconColor="text-danger-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statistics.zoneUsage.map((zone) => (
          <div key={zone.zoneId} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Building2 size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {zone.zoneName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {zone.used}/{zone.total} 个车位
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary-600">
                {zone.usageRate}%
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${zone.usageRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>已使用: {zone.used}</span>
              <span>空闲: {zone.total - zone.used}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PieChart size={20} className="text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                各区域使用率
              </h3>
            </div>
          </div>
          <ReactECharts
            option={zoneUsageOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <LineChart size={20} className="text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                近7天出入趋势
              </h3>
            </div>
          </div>
          <ReactECharts
            option={dailyTrendOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                各部门费用统计
              </h3>
            </div>
          </div>
          <ReactECharts
            option={departmentOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-warning-600" />
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                超时排行榜 TOP 5
              </h3>
            </div>
          </div>
          <ReactECharts
            option={overtimeTrendOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
              超时排行榜明细
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  排名
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  车牌号
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  员工姓名
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  超时次数
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  总超时时长
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  占比
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {statistics.topOvertime.map((item, index) => {
                const totalOvertime = statistics.topOvertime.reduce((s, t) => s + t.overtimeMinutes, 0);
                const percentage = totalOvertime > 0 ? ((item.overtimeMinutes / totalOvertime) * 100).toFixed(1) : 0;
                return (
                  <tr
                    key={item.plateNumber}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-neutral-100 text-neutral-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-neutral-800 dark:text-white">
                        {item.plateNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-800 dark:text-white">
                        {item.employeeName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-800 dark:text-white">
                        {item.count} 次
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-warning-600 font-medium">
                        {formatDuration(item.overtimeMinutes)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
              各部门统计明细
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  部门
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  超时次数
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  总费用
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  平均费用
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                  占比
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {statistics.departmentStats.map((item) => {
                const totalAmount = statistics.departmentStats.reduce((s, d) => s + d.amount, 0);
                const percentage = totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : 0;
                return (
                  <tr
                    key={item.department}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-neutral-800 dark:text-white">
                        {item.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-800 dark:text-white">
                        {item.count} 次
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-danger-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-800 dark:text-white">
                        {formatCurrency(item.amount / item.count)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
