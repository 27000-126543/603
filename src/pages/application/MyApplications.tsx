import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { formatDate, getSpaceTypeText, exportToExcel } from '@/utils/format';
import { daysUntil } from '@/utils/date';
import { Application } from '@/types';

export default function MyApplications() {
  const { currentUser } = useAuthStore();
  const { myApplications, fetchMyApplications, renewApplication, loading } = useApplicationStore();
  const { addLog } = useLogStore();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApps = statusFilter === 'all'
    ? myApplications
    : myApplications.filter(a => a.status === statusFilter);

  const { currentPage, pageSize, totalPages, goToPage, currentData } = usePagination(filteredApps, 10);

  useEffect(() => {
    if (currentUser) {
      fetchMyApplications(currentUser.employeeId);
    }
  }, [currentUser, fetchMyApplications]);

  const handleRenew = async () => {
    if (!selectedApp || !currentUser) return;

    await renewApplication(selectedApp.applicationId);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '续期申请',
      detail: `续期通行证申请 ${selectedApp.applicationId}`,
    });

    setShowRenewModal(false);
    setSelectedApp(null);
  };

  const handleExport = () => {
    if (!currentUser) return;
    const exportData = filteredApps.map(app => ({
      '申请编号': app.applicationId,
      '车牌号': app.plateNumber,
      '车辆类型': app.vehicleType,
      '申请状态': app.status,
      '申请日期': formatDate(app.applyDate),
      '到期日期': formatDate(app.expireDate),
      '停车区域': app.parkingZoneName || '-',
      '车位编号': app.parkingSpaceNumber || '-',
      '车位类型': app.spaceType ? getSpaceTypeText(app.spaceType) : '-',
    }));
    exportToExcel(exportData, `我的通行证申请_${currentUser.employeeId}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: '导出我的通行证申请列表',
    });
  };

  const getExpireWarning = (app: Application) => {
    if (app.status !== 'approved') return null;
    const days = daysUntil(app.expireDate);
    if (days <= 7 && days > 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-warning-600 dark:text-warning-400">
          <AlertTriangle size={12} />
          <span>将在 {days} 天后过期</span>
        </div>
      );
    }
    if (days <= 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
          <AlertTriangle size={12} />
          <span>已过期</span>
        </div>
      );
    }
    return null;
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-neutral-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            我的申请
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看您的通行证申请记录和状态
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
          <Link
            to="/application/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新建申请
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          全部
        </button>
        {['pending', 'approved', 'rejected', 'waiting', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <StatusBadge status={status} />
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 dark:text-white mb-2">
            暂无申请记录
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            您还没有提交过通行证申请
          </p>
          <Link
            to="/application/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            立即申请
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentData.map((app) => (
              <div
                key={app.applicationId}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <StatusBadge status={app.status} />
                      {getExpireWarning(app)}
                      <span className="text-sm text-neutral-400">
                        {app.applicationId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                          车牌号
                        </p>
                        <p className="font-semibold text-neutral-800 dark:text-white">
                          {app.plateNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                          车辆类型
                        </p>
                        <p className="font-medium text-neutral-800 dark:text-white">
                          {app.vehicleType}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-neutral-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                            申请日期
                          </p>
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {formatDate(app.applyDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-neutral-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                            到期日期
                          </p>
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {formatDate(app.expireDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {app.parkingZoneId && (
                      <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <MapPin size={16} className="text-primary-600" />
                        <span className="text-sm text-primary-700 dark:text-primary-300">
                          车位：{app.parkingZoneName} {app.parkingSpaceNumber}
                          {app.spaceType && ` (${getSpaceTypeText(app.spaceType)})`}
                        </span>
                      </div>
                    )}

                    {app.status === 'waiting' && app.estimatedWaitHours && (
                      <div className="flex items-center gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                        <Clock size={16} className="text-warning-600" />
                        <span className="text-sm text-warning-700 dark:text-warning-300">
                          预计等待约 {app.estimatedWaitHours} 小时
                        </span>
                      </div>
                    )}

                    {app.remark && (
                      <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          备注：{app.remark}
                        </p>
                      </div>
                    )}
                  </div>

                  {app.status === 'approved' && daysUntil(app.expireDate) <= 30 && (
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowRenewModal(true);
                      }}
                      className="btn-primary flex items-center gap-2 ml-4"
                    >
                      <RefreshCw size={16} />
                      续期
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredApps.length}
            onPageChange={goToPage}
          />
        </>
      )}

      <ConfirmModal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedApp(null);
        }}
        onConfirm={handleRenew}
        title="确认续期"
        message={`确定要为 ${selectedApp?.plateNumber} 续期通行证吗？续期后有效期将延长6个月。`}
        confirmText="确认续期"
        variant="primary"
      />
    </div>
  );
}
