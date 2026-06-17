import { useEffect, useState } from 'react';
import {
  Car,
  Search,
  Download,
  Calendar,
  Clock,
  DollarSign,
  User,
  ArrowRight,
  AlertTriangle,
  Eye,
  X,
  LogIn,
  LogOut,
  CheckCircle,
} from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { usePagination } from '@/hooks/usePagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  formatDateTime,
  formatDuration,
  formatCurrency,
  exportToExcel,
  formatPlateNumber,
  validatePlateNumber,
} from '@/utils/format';
import { AccessRecord } from '@/types';

export default function AccessRecords() {
  const { currentUser } = useAuthStore();
  const { canViewAllRecords, isAdmin } = usePermission();
  const { records, fetchRecords, loading, total, getTodayStats, createEntryRecord, createExitRecord, findActiveRecord } = useRecordStore();
  const { addLog } = useLogStore();

  const [filters, setFilters] = useState({
    plateNumber: '',
    startDate: '',
    endDate: '',
    status: 'all',
    page: 1,
    pageSize: 10,
  });
  const [viewRecord, setViewRecord] = useState<AccessRecord | null>(null);
  const [entryPlate, setEntryPlate] = useState('');
  const [exitPlate, setExitPlate] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState<string | null>(null);

  const { currentPage, pageSize, totalPages, goToPage, currentData } = usePagination(records, 10);
  const todayStats = getTodayStats(canViewAllRecords ? undefined : currentUser?.employeeId);

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const loadRecords = async () => {
    const apiFilters: any = {
      page: filters.page,
      pageSize: filters.pageSize,
    };

    if (!canViewAllRecords && currentUser) {
      apiFilters.employeeId = currentUser.employeeId;
    }
    if (filters.plateNumber) apiFilters.plateNumber = filters.plateNumber;
    if (filters.startDate) apiFilters.startDate = filters.startDate;
    if (filters.endDate) apiFilters.endDate = filters.endDate;
    if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;

    await fetchRecords(apiFilters);
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadRecords();
  };

  const handleReset = () => {
    setFilters({
      plateNumber: '',
      startDate: '',
      endDate: '',
      status: 'all',
      page: 1,
      pageSize: 10,
    });
  };

  const handleExport = () => {
    if (!currentUser) return;
    const exportData = records.map(record => ({
      '记录编号': record.recordId,
      '车牌号': record.plateNumber,
      '员工姓名': record.employeeName || '-',
      '员工工号': record.employeeId || '-',
      '入场时间': formatDateTime(record.entryTime),
      '出场时间': record.exitTime ? formatDateTime(record.exitTime) : '未出场',
      '停留时长': record.durationMinutes ? formatDuration(record.durationMinutes) : '-',
      '超时时长': record.overtimeMinutes ? formatDuration(record.overtimeMinutes) : '-',
      '超时费用': record.expense ? formatCurrency(record.expense) : '-',
      '状态': record.exitTime ? '已出场' : '在场',
    }));
    exportToExcel(exportData, `出入记录_${new Date().toISOString().slice(0, 10)}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: '导出出入记录列表',
    });
  };

  const handleEntry = async () => {
    if (!currentUser || !validatePlateNumber(entryPlate)) {
      setShowError('请输入正确的车牌号');
      setTimeout(() => setShowError(null), 3000);
      return;
    }

    const result = await createEntryRecord(entryPlate, currentUser.employeeId);
    if (result) {
      setShowSuccess(`车辆 ${result.plateNumber} 入场成功`);
      setEntryPlate('');
      addLog({
        operatorId: currentUser.employeeId,
        operatorName: currentUser.name,
        operationType: '车辆入场',
        detail: `车牌 ${result.plateNumber} 入场登记`,
        targetId: result.recordId,
        targetType: 'accessRecord',
        resultStatus: 'success',
        remark: `车辆 ${result.plateNumber} 入场`,
      });
      loadRecords();
    } else {
      setShowError('该车辆已在场或车牌格式错误');
    }
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleExit = async () => {
    if (!currentUser || !validatePlateNumber(exitPlate)) {
      setShowError('请输入正确的车牌号');
      setTimeout(() => setShowError(null), 3000);
      return;
    }

    const activeRecord = findActiveRecord(exitPlate);
    if (!activeRecord) {
      setShowError('未找到该车辆的在场记录');
      setTimeout(() => setShowError(null), 3000);
      return;
    }

    const result = await createExitRecord(activeRecord.recordId, exitTime || undefined);
    if (result) {
      let message = `车辆 ${result.plateNumber} 出场成功`;
      if (result.expense && result.expense > 0) {
        message += `，超时费用 ${formatCurrency(result.expense)}`;
      }
      setShowSuccess(message);
      setExitPlate('');
      setExitTime('');
      addLog({
        operatorId: currentUser.employeeId,
        operatorName: currentUser.name,
        operationType: '车辆出场',
        detail: `车牌 ${result.plateNumber} 出场登记${result.expense && result.expense > 0 ? `，费用 ${formatCurrency(result.expense)}` : ''}`,
        targetId: result.recordId,
        targetType: 'accessRecord',
        resultStatus: 'success',
        remark: `车辆 ${result.plateNumber} 出场${result.expense && result.expense > 0 ? `，费用 ${formatCurrency(result.expense)}` : ''}`,
      });
      loadRecords();
    } else {
      setShowError('出场登记失败');
    }
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const filteredData = currentData.filter(record => {
    if (filters.plateNumber && !record.plateNumber.includes(filters.plateNumber.toUpperCase())) {
      return false;
    }
    return true;
  });

  const totalOvertime = filteredData.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
  const totalExpense = filteredData.reduce((sum, r) => sum + (r.expense || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            出入记录
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {canViewAllRecords
              ? '查看和管理所有车辆的出入场记录'
              : '查看您的车辆出入场记录'}
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

      {showSuccess && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-success-600 flex-shrink-0" size={20} />
          <p className="text-success-700 dark:text-success-300">{showSuccess}</p>
        </div>
      )}

      {showError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-danger-600 flex-shrink-0" size={20} />
          <p className="text-danger-700 dark:text-danger-300">{showError}</p>
        </div>
      )}

      {(isAdmin || canViewAllRecords) && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">
            车牌识别登记
          </h2>
          <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'entry'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <LogIn size={16} />
                入场登记
              </div>
            </button>
            <button
              onClick={() => setActiveTab('exit')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'exit'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <LogOut size={16} />
                出场登记
              </div>
            </button>
          </div>

          {activeTab === 'entry' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  车牌号 <span className="text-danger-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={entryPlate}
                    onChange={(e) => setEntryPlate(formatPlateNumber(e.target.value))}
                    placeholder="请输入车牌号，如：京A12345"
                    className="input flex-1"
                    maxLength={8}
                  />
                  <button
                    onClick={handleEntry}
                    disabled={loading || !entryPlate}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <LogIn size={18} />
                    )}
                    入场
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  车牌号 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={exitPlate}
                  onChange={(e) => setExitPlate(formatPlateNumber(e.target.value))}
                  placeholder="请输入车牌号，如：京A12345"
                  className="input"
                  maxLength={8}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  出场时间 <span className="text-neutral-400">(可选，默认当前时间)</span>
                </label>
                <input
                  type="datetime-local"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="input"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleExit}
                  disabled={loading || !exitPlate}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  出场
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">今日入场</p>
              <p className="text-2xl font-bold text-primary-600">
                {todayStats.entryCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Car size={24} className="text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">今日出场</p>
              <p className="text-2xl font-bold text-success-600">
                {todayStats.exitCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <ArrowRight size={24} className="text-success-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">总超时时长</p>
              <p className="text-2xl font-bold text-warning-600">
                {formatDuration(totalOvertime)}
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
              <p className="text-sm text-neutral-500 mb-1">总超时费用</p>
              <p className="text-2xl font-bold text-danger-600">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <DollarSign size={24} className="text-danger-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              车牌号
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={filters.plateNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, plateNumber: e.target.value }))}
                placeholder="请输入车牌号"
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="all">全部</option>
              <option value="active">在场</option>
              <option value="exited">已出场</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              开始日期
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              结束日期
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Search size={18} />
              搜索
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost"
            >
              重置
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
                      车牌号
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      {canViewAllRecords ? '员工信息' : '入场时间'}
                    </th>
                    {canViewAllRecords && (
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                        入场时间
                      </th>
                    )}
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      出场时间
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      停留时长
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      超时
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                      费用
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
                  {filteredData.map(record => (
                    <tr
                      key={record.recordId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <Car size={18} className="text-primary-600" />
                          </div>
                          <span className="font-semibold text-neutral-800 dark:text-white font-mono">
                            {record.plateNumber}
                          </span>
                        </div>
                      </td>
                      {canViewAllRecords && (
                        <td className="px-6 py-4">
                          {record.employeeName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <User size={14} className="text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-800 dark:text-white">
                                  {record.employeeName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {record.employeeId}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-800 dark:text-white">
                          {formatDateTime(record.entryTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.exitTime ? (
                          <div className="text-sm text-neutral-800 dark:text-white">
                            {formatDateTime(record.exitTime)}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-primary-600">
                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                            在场中
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.durationMinutes ? (
                          <span className="text-sm text-neutral-800 dark:text-white">
                            {formatDuration(record.durationMinutes)}
                          </span>
                        ) : (
                          <Clock size={16} className="text-neutral-400 animate-spin" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.overtimeMinutes ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle size={14} className="text-warning-500" />
                            <span className="text-sm text-warning-600">
                              {formatDuration(record.overtimeMinutes)}
                            </span>
                          </div>
                        ) : record.exitTime ? (
                          <span className="text-sm text-success-600">无超时</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.expense ? (
                          <span className="font-semibold text-danger-600">
                            {formatCurrency(record.expense)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={record.exitTime ? 'approved' : 'pending'}
                          customText={record.exitTime ? '已出场' : '在场'}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setViewRecord(record)}
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
                <Car size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">
                  暂无出入记录
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

      {viewRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-lg w-full animate-fade-in">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  出入记录详情
                </h3>
                <button
                  onClick={() => setViewRecord(null)}
                  className="btn-ghost p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center py-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <Car size={40} className="text-white" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-neutral-800 dark:text-white font-mono">
                  {viewRecord.plateNumber}
                </p>
                {viewRecord.employeeName && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {viewRecord.employeeName} ({viewRecord.employeeId})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
                  <p className="text-xs text-neutral-500 mb-1">入场时间</p>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {formatDateTime(viewRecord.entryTime)}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
                  <p className="text-xs text-neutral-500 mb-1">出场时间</p>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {viewRecord.exitTime ? formatDateTime(viewRecord.exitTime) : '-'}
                  </p>
                </div>
              </div>

              {viewRecord.durationMinutes && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-neutral-500 mb-1">停留时长</p>
                    <p className="text-lg font-bold text-neutral-800 dark:text-white">
                      {formatDuration(viewRecord.durationMinutes)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-500 mb-1">超时时长</p>
                    <p className={`text-lg font-bold ${
                      viewRecord.overtimeMinutes ? 'text-warning-600' : 'text-success-600'
                    }`}>
                      {viewRecord.overtimeMinutes
                        ? formatDuration(viewRecord.overtimeMinutes)
                        : '无'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-500 mb-1">超时费用</p>
                    <p className={`text-lg font-bold ${
                      viewRecord.expense ? 'text-danger-600' : 'text-neutral-800 dark:text-white'
                    }`}>
                      {viewRecord.expense ? formatCurrency(viewRecord.expense) : '-'}
                    </p>
                  </div>
                </div>
              )}

              {viewRecord.expense && viewRecord.expense > 0 && (
                <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={20} className="text-danger-600" />
                      <span className="font-medium text-danger-700 dark:text-danger-300">
                        超时费用说明
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-danger-600">
                      {formatCurrency(viewRecord.expense)}
                    </span>
                  </div>
                  <p className="text-sm text-danger-600 dark:text-danger-400 mt-2">
                    免费时长8小时，超出部分每分钟0.1元。
                    本次停留{formatDuration(viewRecord.durationMinutes || 0)}，
                    超时{formatDuration(viewRecord.overtimeMinutes || 0)}。
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <StatusBadge
                  status={viewRecord.exitTime ? 'approved' : 'pending'}
                  customText={viewRecord.exitTime ? '已出场' : '在场'}
                />
                <span className="text-sm text-neutral-500">
                  记录编号：{viewRecord.recordId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
