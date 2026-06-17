import { useEffect, useState } from 'react';
import {
  DollarSign,
  Search,
  Download,
  Calendar,
  Clock,
  Car,
  User,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { usePagination } from '@/hooks/usePagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import {
  formatDate,
  formatCurrency,
  formatDuration,
  exportToExcel,
} from '@/utils/format';
import { getCurrentMonth, getMonthList } from '@/utils/date';
import { Expense } from '@/types';

export default function ExpenseList() {
  const { currentUser } = useAuthStore();
  const { canViewAllRecords } = usePermission();
  const { expenses, fetchExpenses, loading, total, getMonthlySummary } = useFinanceStore();
  const { addLog } = useLogStore();

  const [filters, setFilters] = useState({
    month: getCurrentMonth(),
    status: 'all',
    page: 1,
    pageSize: 10,
  });
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  const { currentPage, pageSize, totalPages, goToPage, currentData } = usePagination(expenses, 10);
  const monthlySummary = getMonthlySummary(filters.month, !canViewAllRecords ? currentUser?.employeeId : undefined);
  const monthList = getMonthList(12);

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    const apiFilters: any = {
      page: filters.page,
      pageSize: filters.pageSize,
      month: filters.month,
    };

    if (!canViewAllRecords && currentUser) {
      apiFilters.employeeId = currentUser.employeeId;
    }
    if (filters.status !== 'all') {
      apiFilters.status = filters.status;
    }

    await fetchExpenses(apiFilters);
  };

  const handleExport = () => {
    if (!currentUser) return;
    const exportData = filteredData.map(expense => ({
      '费用编号': expense.expenseId,
      '员工姓名': expense.employeeName,
      '员工工号': expense.employeeId,
      '车牌号': expense.plateNumber,
      '超时时长': formatDuration(expense.overtimeMinutes),
      '费用金额': formatCurrency(expense.amount),
      '扣费日期': formatDate(expense.deductionDate),
      '工资月份': expense.salaryMonth,
      '状态': expense.status === 'pending' ? '待扣除' :
              expense.status === 'deducted' ? '已扣除' : '已减免',
    }));
    exportToExcel(exportData, `费用明细_${filters.month}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: `导出${filters.month}月份费用明细`,
    });
  };

  const filteredData = currentData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deducted':
        return <CheckCircle size={16} className="text-success-500" />;
      case 'pending':
        return <Clock size={16} className="text-warning-500" />;
      case 'exempted':
        return <XCircle size={16} className="text-neutral-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            费用明细
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {canViewAllRecords
              ? '查看和管理所有员工的超时停车费用'
              : '查看您的超时停车费用明细'}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center gap-2"
        >
          <Download size={18} />
          导出数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">总费用</p>
              <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                {formatCurrency(monthlySummary.totalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <DollarSign size={24} className="text-primary-600" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            共 {monthlySummary.totalCount} 笔
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">已扣除</p>
              <p className="text-2xl font-bold text-success-600">
                {formatCurrency(monthlySummary.deductedAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <CheckCircle size={24} className="text-success-600" />
            </div>
          </div>
          <p className="text-xs text-success-500 mt-2">
            已从工资中扣除
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">待扣除</p>
              <p className="text-2xl font-bold text-warning-600">
                {formatCurrency(monthlySummary.pendingAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <Clock size={24} className="text-warning-600" />
            </div>
          </div>
          <p className="text-xs text-warning-500 mt-2">
            即将从工资扣除
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">平均超时</p>
              <p className="text-2xl font-bold text-danger-600">
                {monthlySummary.totalCount > 0
                  ? formatDuration(Math.floor(
                      filteredData.reduce((sum, e) => sum + e.overtimeMinutes, 0) /
                      monthlySummary.totalCount
                    ))
                  : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <AlertTriangle size={24} className="text-danger-600" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            每次超时平均时长
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              工资月份
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value, page: 1 }))}
              className="input w-40"
            >
              {monthList.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              费用状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="input w-32"
            >
              <option value="all">全部</option>
              <option value="pending">待扣除</option>
              <option value="deducted">已扣除</option>
              <option value="exempted">已减免</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      {canViewAllRecords ? '员工信息' : '车牌号'}
                    </th>
                    {canViewAllRecords && (
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                        车牌号
                      </th>
                    )}
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      超时时长
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      费用金额
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      扣费日期
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      工资月份
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      状态
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-neutral-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredData.map(expense => (
                    <tr
                      key={expense.expenseId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {canViewAllRecords ? (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <User size={18} className="text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-800 dark:text-white">
                                  {expense.employeeName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {expense.employeeId}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <Car size={18} className="text-primary-600" />
                              </div>
                              <span className="font-semibold text-neutral-800 dark:text-white font-mono">
                                {expense.plateNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      {canViewAllRecords && (
                        <td className="px-6 py-4">
                          <span className="font-medium text-neutral-800 dark:text-white font-mono">
                            {expense.plateNumber}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={14} className="text-warning-500" />
                          <span className="text-sm text-warning-600">
                            {formatDuration(expense.overtimeMinutes)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-danger-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-800 dark:text-white">
                          {formatDate(expense.deductionDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {expense.salaryMonth}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(expense.status)}
                          <StatusBadge
                            status={expense.status}
                            customText={
                              expense.status === 'pending' ? '待扣除' :
                              expense.status === 'deducted' ? '已扣除' : '已减免'
                            }
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setViewExpense(expense)}
                            className="btn-ghost p-2"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="py-12 text-center">
                <DollarSign size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">
                  暂无费用记录
                </p>
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={(page) => {
              goToPage(page);
              setFilters(prev => ({ ...prev, page }));
            }}
          />
        </>
      )}

      {viewExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-lg w-full animate-fade-in">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  费用详情
                </h3>
                <button
                  onClick={() => setViewExpense(null)}
                  className="btn-ghost p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center py-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <DollarSign size={40} className="text-white" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-4xl font-bold text-danger-600">
                  {formatCurrency(viewExpense.amount)}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {getStatusIcon(viewExpense.status)}
                  <StatusBadge
                    status={viewExpense.status}
                    customText={
                      viewExpense.status === 'pending' ? '待扣除' :
                      viewExpense.status === 'deducted' ? '已扣除' : '已减免'
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">员工姓名</p>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {viewExpense.employeeName}
                  </p>
                  <p className="text-xs text-neutral-500">{viewExpense.employeeId}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">车牌号</p>
                  <p className="font-semibold text-neutral-800 dark:text-white font-mono">
                    {viewExpense.plateNumber}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">超时时长</p>
                  <p className="font-semibold text-warning-600">
                    {formatDuration(viewExpense.overtimeMinutes)}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">关联记录</p>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {viewExpense.recordId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">扣费日期</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {formatDate(viewExpense.deductionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">工资月份</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewExpense.salaryMonth}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} className="text-danger-600" />
                  <span className="font-medium text-danger-700 dark:text-danger-300">
                    计费说明
                  </span>
                </div>
                <p className="text-sm text-danger-600 dark:text-danger-400">
                  免费时长8小时，超出部分每分钟0.1元。
                  本次超时{formatDuration(viewExpense.overtimeMinutes)}，
                  费用{formatCurrency(viewExpense.amount)}将从{viewExpense.salaryMonth}工资中扣除。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
