import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  Download,
  Eye,
  Clock,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { usePermission } from '@/hooks/usePermission';
import {
  formatDate,
  getSpaceTypeText,
  exportToExcel,
  validatePlateNumber,
} from '@/utils/format';
import { Application } from '@/types';

export default function ApplicationList() {
  const { currentUser } = useAuthStore();
  const { isAdmin } = usePermission();
  const {
    allApplications,
    fetchAllApplications,
    approveApplication,
    rejectApplication,
    loading,
    total,
  } = useApplicationStore();
  const { addLog } = useLogStore();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewApp, setViewApp] = useState<Application | null>(null);

  const [filters, setFilters] = useState({
    status: 'all',
    employeeId: '',
    plateNumber: '',
    page: 1,
    pageSize: 10,
  });

  const { currentPage, pageSize, totalPages, goToPage, currentData } = usePagination(
    allApplications,
    10
  );

  useEffect(() => {
    loadApplications();
  }, [filters]);

  const loadApplications = async () => {
    const apiFilters: any = {
      page: filters.page,
      pageSize: filters.pageSize,
    };
    if (filters.status !== 'all') apiFilters.status = filters.status;
    if (filters.employeeId) apiFilters.employeeId = filters.employeeId;

    await fetchAllApplications(apiFilters);
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadApplications();
  };

  const handleApprove = async () => {
    if (!selectedApp || !currentUser) return;

    await approveApplication(selectedApp.applicationId);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '审批通过',
      detail: `通过通行证申请 ${selectedApp.applicationId}`,
    });

    setShowApproveModal(false);
    setSelectedApp(null);
    loadApplications();
  };

  const handleReject = async () => {
    if (!selectedApp || !currentUser || !rejectReason) return;

    await rejectApplication(selectedApp.applicationId, rejectReason);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '审批拒绝',
      detail: `拒绝通行证申请 ${selectedApp.applicationId}，原因：${rejectReason}`,
    });

    setShowRejectModal(false);
    setSelectedApp(null);
    setRejectReason('');
    loadApplications();
  };

  const handleExport = () => {
    if (!currentUser) return;
    const exportData = allApplications.map(app => ({
      '申请编号': app.applicationId,
      '员工工号': app.employeeId,
      '员工姓名': app.employeeName,
      '车牌号': app.plateNumber,
      '车辆类型': app.vehicleType,
      '车主姓名': app.ownerName,
      '申请状态': app.status,
      '申请日期': formatDate(app.applyDate),
      '审批日期': app.approvedDate ? formatDate(app.approvedDate) : '-',
      '到期日期': formatDate(app.expireDate),
      '停车区域': app.parkingZoneName || '-',
      '车位编号': app.parkingSpaceNumber || '-',
      '车位类型': app.spaceType ? getSpaceTypeText(app.spaceType) : '-',
      '备注': app.remark || '-',
    }));
    exportToExcel(exportData, `通行证申请列表_${formatDate(new Date())}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: '导出通行证申请列表',
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredData = currentData.filter(app => {
    if (filters.plateNumber && !app.plateNumber.includes(filters.plateNumber.toUpperCase())) {
      return false;
    }
    return true;
  });

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'waiting', label: '等待中' },
    { value: 'expired', label: '已过期' },
  ];

  if (!isAdmin) {
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
            申请管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            审核和管理所有通行证申请
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

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              申请状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              员工工号
            </label>
            <input
              type="text"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              placeholder="请输入工号"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              车牌号
            </label>
            <input
              type="text"
              value={filters.plateNumber}
              onChange={(e) => handleFilterChange('plateNumber', e.target.value)}
              placeholder="请输入车牌号"
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center gap-2 w-full"
            >
              <Search size={18} />
              搜索
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
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      申请信息
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      员工信息
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      车辆信息
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      日期信息
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      车位分配
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      状态
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredData.map((app) => (
                    <tr
                      key={app.applicationId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-800 dark:text-white">
                          {app.applicationId}
                        </p>
                        {app.remark && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            备注：{app.remark}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User size={14} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800 dark:text-white">
                              {app.employeeName}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {app.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-800 dark:text-white">
                          {app.plateNumber}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {app.vehicleType} · {app.ownerName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                          <Calendar size={14} />
                          <span>{formatDate(app.applyDate)}</span>
                        </div>
                        {app.approvedDate && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            <Check size={12} />
                            <span>审批：{formatDate(app.approvedDate)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {app.parkingZoneId ? (
                          <div>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin size={14} className="text-primary-600" />
                              <span className="text-neutral-800 dark:text-white">
                                {app.parkingZoneName} {app.parkingSpaceNumber}
                              </span>
                            </div>
                            {app.spaceType && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {getSpaceTypeText(app.spaceType)}
                              </span>
                            )}
                          </div>
                        ) : app.status === 'waiting' ? (
                          <div className="flex items-center gap-1 text-xs text-warning-600">
                            <Clock size={12} />
                            <span>等待分配</span>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewApp(app)}
                            className="btn-ghost p-2"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setShowApproveModal(true);
                                }}
                                className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                title="通过"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setShowRejectModal(true);
                                }}
                                className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                title="拒绝"
                              >
                                <X size={16} />
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
                <ClipboardList size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">
                  暂无申请记录
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
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedApp(null);
        }}
        onConfirm={handleApprove}
        title="确认通过"
        message={`确定要通过 ${selectedApp?.employeeName} 的 ${selectedApp?.plateNumber} 通行证申请吗？系统将自动分配车位。`}
        confirmText="确认通过"
        variant="success"
      />

      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedApp(null);
          setRejectReason('');
        }}
        onConfirm={handleReject}
        title="拒绝申请"
        message={`请填写拒绝 ${selectedApp?.employeeName} 的 ${selectedApp?.plateNumber} 通行证申请的原因：`}
        confirmText="确认拒绝"
        variant="danger"
      >
        <div className="mt-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入拒绝原因"
            className="input min-h-[100px]"
            required
          />
        </div>
      </ConfirmModal>

      {viewApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  申请详情
                </h3>
                <button
                  onClick={() => setViewApp(null)}
                  className="btn-ghost p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <StatusBadge status={viewApp.status} />
                <span className="text-sm text-neutral-500">
                  {viewApp.applicationId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">员工姓名</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.employeeName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">员工工号</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.employeeId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">车牌号</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.plateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">车辆类型</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">车主姓名</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.ownerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">发动机号</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {viewApp.engineNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">申请日期</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {formatDate(viewApp.applyDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">到期日期</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {formatDate(viewApp.expireDate)}
                  </p>
                </div>
              </div>

              {viewApp.parkingZoneId && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                    车位分配
                  </p>
                  <p className="text-neutral-800 dark:text-white">
                    {viewApp.parkingZoneName} {viewApp.parkingSpaceNumber}
                    {viewApp.spaceType && ` (${getSpaceTypeText(viewApp.spaceType)})`}
                  </p>
                </div>
              )}

              {viewApp.remark && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    备注
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {viewApp.remark}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
