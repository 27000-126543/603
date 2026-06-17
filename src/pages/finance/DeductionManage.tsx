import { useEffect, useState } from 'react';
import {
  DollarSign,
  Download,
  Calendar,
  Clock,
  Check,
  X,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { usePagination } from '@/hooks/usePagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  formatDate,
  formatCurrency,
  formatDuration,
  exportToExcel,
} from '@/utils/format';
import { getCurrentMonth, getMonthList } from '@/utils/date';
import { Expense } from '@/types';

export default function DeductionManage() {
  const { currentUser } = useAuthStore();
  const { canViewFinance } = usePermission();
  const {
    expenses,
    fetchExpenses,
    loading,
    total,
    getMonthlySummary,
    processDeduction,
    exemptExpense,
  } = useFinanceStore();
  const { addLog } = useLogStore();

  const [filters, setFilters] = useState({
    month: getCurrentMonth(),
    status: 'pending',
    page: 1,
    pageSize: 10,
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showExemptModal, setShowExemptModal] = useState(false);
  const [exemptReason, setExemptReason] = useState('');

  const { currentPage, pageSize, totalPages, goToPage, currentData } = usePagination(expenses, 10);
  const monthlySummary = getMonthlySummary(filters.month);
  const monthList = getMonthList(12);

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    await fetchExpenses({
      page: filters.page,
      pageSize: filters.pageSize,
      month: filters.month,
      status: filters.status,
    });
  };

  const handleBatchDeduct = async () => {
    if (!currentUser) return;

    const pendingExpenses = expenses.filter(e => e.status === 'pending');
    for (const expense of pendingExpenses) {
      await processDeduction(expense.expenseId);
    }

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '批量扣费',
      detail: `批量扣除${filters.month}月份停车费用，共${pendingExpenses.length}笔`,
    });

    loadExpenses();
  };

  const handleDeduct = async () => {
    if (!selectedExpense || !currentUser) return;

    await processDeduction(selectedExpense.expenseId);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '单条扣费',
      detail: `扣除${selectedExpense.employeeName}的停车费用${formatCurrency(selectedExpense.amount)}`,
    });

    setShowDeductModal(false);
    setSelectedExpense(null);
    loadExpenses();
  };

  const handleExempt = async () => {
    if (!selectedExpense || !currentUser || !exemptReason) return;

    await exemptExpense(selectedExpense.expenseId, exemptReason);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '费用减免',
      detail: `减免${selectedExpense.employeeName}的停车费用${formatCurrency(selectedExpense.amount)}，原因：${exemptReason}`,
    });

    setShowExemptModal(false);
    setSelectedExpense(null);
    setExemptReason('');
    loadExpenses();
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
    exportToExcel(exportData, `扣费管理_${filters.month}_${filters.status}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: `导出${filters.month}月份${filters.status}费用列表`,
    });
  };

  const filteredData = currentData;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  if (!canViewFinance) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-neutral-500">您没有权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            扣费管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            管理停车费用的扣除和减免操作
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-ghost flex items-center gap-2"
          >
            <Download size={18} />
            导出
          </button>
          {pendingCount > 0 && filters.status === 'pending' && (
            <button
              onClick={handleBatchDeduct}
              className="btn-success flex items-center gap-2"
            >
              <Check size={18} />
              批量扣费 ({pendingCount})
            </button>
          )}
        </div>
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
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">待处理笔数</p>
              <p className="text-2xl font-bold text-danger-600">
                {pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <AlertTriangle size={24} className="text-danger-600" />
            </div>
          </div>
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
              <option value="pending">待扣除</option>
              <option value="deducted">已扣除</option>
              <option value="exempted">已减免</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => loadExpenses()}
              className="btn-ghost flex items-center gap-2"
            >
              <RefreshCw size={18} />
              刷新
            </button>
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
                      员工信息
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      车牌号
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      超时时长
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      费用金额
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
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-800 dark:text-white font-mono">
                          {expense.plateNumber}
                        </span>
                      </td>
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
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {expense.salaryMonth}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={expense.status}
                          customText={
                            expense.status === 'pending' ? '待扣除' :
                            expense.status === 'deducted' ? '已扣除' : '已减免'
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowDeductModal(true);
                                }}
                                className="btn-success text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                <Check size={14} />
                                扣除
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowExemptModal(true);
                                }}
                                className="btn-warning text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                减免
                              </button>
                            </>
                          )}
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
                  暂无{filters.status === 'pending' ? '待扣除' :
                       filters.status === 'deducted' ? '已扣除' : '已减免'}的费用记录
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

      <ConfirmModal
        isOpen={showDeductModal}
        onClose={() => {
          setShowDeductModal(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeduct}
        title="确认扣除"
        message={`确定要从 ${selectedExpense?.employeeName} 的工资中扣除停车费用 ${selectedExpense ? formatCurrency(selectedExpense.amount) : ''} 吗？`}
        confirmText="确认扣除"
        variant="success"
      />

      <ConfirmModal
        isOpen={showExemptModal}
        onClose={() => {
          setShowExemptModal(false);
          setSelectedExpense(null);
          setExemptReason('');
        }}
        onConfirm={handleExempt}
        title="费用减免"
        message={`请填写减免 ${selectedExpense?.employeeName} 停车费用 ${selectedExpense ? formatCurrency(selectedExpense.amount) : ''} 的原因：`}
        confirmText="确认减免"
        variant="warning"
      >
        <div className="mt-4">
          <textarea
            value={exemptReason}
            onChange={(e) => setExemptReason(e.target.value)}
            placeholder="请输入减免原因"
            className="input min-h-[100px]"
            required
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
