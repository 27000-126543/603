import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Car,
  FileCheck,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReportStore } from '@/store/useReportStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/format';
import { mockApplications, mockParkingZones } from '@/mock/data';

export default function Dashboard() {
  const { statistics, fetchStatistics, loading } = useReportStore();
  const { currentUser } = useAuthStore();
  const { isAdmin, isFinance } = usePermission();
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchStatistics().then(() => {
      setTimeout(() => setChartLoading(false), 500);
    });
  }, [fetchStatistics]);

  if (loading || !statistics) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const usageChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
    },
    color: ['#3b82f6', '#10b981', '#f59e0b'],
    series: [
      {
        name: '车位使用率',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
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
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        data: statistics.zoneUsage.map((z) => ({
          value: z.used,
          name: z.zoneName,
        })),
      },
    ],
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['入场数', '出场数'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    color: ['#3b82f6', '#10b981'],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: statistics.dailyTrend.map((d) => d.date.slice(5)),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '入场数',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        data: statistics.dailyTrend.map((d) => d.entryCount),
      },
      {
        name: '出场数',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ],
          },
        },
        data: statistics.dailyTrend.map((d) => d.exitCount),
      },
    ],
  };

  const deptChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    color: ['#3b82f6'],
    xAxis: {
      type: 'category',
      data: statistics.departmentStats.map((d) => d.department),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '超时次数',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
        data: statistics.departmentStats.map((d) => d.count),
      },
    ],
  };

  const pendingApps = mockApplications.filter(a => a.status === 'pending' || a.status === 'waiting').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">
            你好，{currentUser?.name} 👋
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            欢迎回来，这是今日的停车场运营概览
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日入场车辆"
          value={statistics.todayEntryCount}
          icon={<Car size={20} />}
          variant="primary"
          trend={12.5}
          trendLabel="较昨日"
        />
        <StatCard
          title="待处理申请"
          value={statistics.pendingApplications}
          icon={<FileCheck size={20} />}
          variant="warning"
        />
        <StatCard
          title="超时率"
          value={`${statistics.overtimeRate}%`}
          icon={<Clock size={20} />}
          variant="danger"
          trend={-3.2}
          trendLabel="较上周"
        />
        <StatCard
          title="本月费用"
          value={formatCurrency(statistics.totalAmountThisMonth)}
          icon={<DollarSign size={20} />}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-6">
          <h3 className="font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" />
            各区域车位使用率
          </h3>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ReactECharts option={usageChartOption} style={{ height: '260px' }} />
          )}
          <div className="grid grid-cols-1 gap-3 mt-4">
            {statistics.zoneUsage.map((zone) => (
              <div key={zone.zoneId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">{zone.zoneName}</span>
                  <span className="font-medium text-neutral-800 dark:text-white">
                    {zone.used}/{zone.total} ({zone.usageRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${zone.usageRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" />
            近7日出入趋势
          </h3>
          {chartLoading ? (
            <div className="h-72 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ReactECharts option={trendChartOption} style={{ height: '280px' }} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning-500" />
              待处理事项
            </h3>
            {(isAdmin || isFinance) && (
              <Link
                to="/application/list"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </Link>
            )}
          </div>
          {pendingApps.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              暂无待处理事项
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApps.map((app) => (
                <div
                  key={app.applicationId}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Users size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-white">
                        {app.employeeName}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {app.plateNumber} · {app.vehicleType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={app.status} />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {app.applyDate?.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-success-500" />
            超时排行榜
          </h3>
          <div className="space-y-4">
            {statistics.topOvertime.map((item, idx) => (
              <div
                key={item.plateNumber}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-warning-500 text-white' :
                    idx === 1 ? 'bg-neutral-400 text-white' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-neutral-800 dark:text-white">
                      {item.plateNumber}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.employeeName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-danger-600 dark:text-danger-400">
                    {item.overtimeMinutes}分钟
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {item.count}次
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-success-500" />
          各部门超时统计
        </h3>
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <ReactECharts option={deptChartOption} style={{ height: '240px' }} />
        )}
      </div>
    </div>
  );
}
