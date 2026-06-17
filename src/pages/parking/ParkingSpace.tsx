import { useEffect, useState } from 'react';
import {
  Car,
  MapPin,
  User,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { exportToExcel } from '@/utils/format';
import { ParkingSpace, ParkingZone } from '@/types';

export default function ParkingSpacePage() {
  const { currentUser } = useAuthStore();
  const { isAdmin } = usePermission();
  const { zones, spaces, selectedZoneId, loading, fetchZones, fetchSpaces, releaseSpace, updateSpaceStatus } = useParkingStore();
  const { addLog } = useLogStore();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchZones();
    fetchSpaces();
  }, [fetchZones, fetchSpaces]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    if (zoneId === 'all') {
      fetchSpaces();
    } else {
      fetchSpaces(zoneId);
    }
  };

  const handleRelease = async () => {
    if (!selectedSpace || !currentUser) return;

    await releaseSpace(selectedSpace.spaceId);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '释放车位',
      detail: `释放车位 ${selectedSpace.zoneName} ${selectedSpace.spaceNumber}`,
    });

    setShowReleaseModal(false);
    setSelectedSpace(null);
  };

  const handleStatusChange = async (space: ParkingSpace, status: ParkingSpace['status']) => {
    if (!currentUser) return;

    await updateSpaceStatus(space.spaceId, status);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '更新车位状态',
      detail: `更新车位 ${space.zoneName} ${space.spaceNumber} 状态为 ${status}`,
    });
  };

  const handleExport = () => {
    if (!currentUser) return;
    const exportData = filteredSpaces.map(space => ({
      '区域名称': space.zoneName,
      '车位编号': space.spaceNumber,
      '车位类型': space.spaceType === 'fixed' ? '固定车位' : '临时车位',
      '车位状态': space.status,
      '使用员工': space.employeeName || '-',
      '员工工号': space.employeeId || '-',
      '车牌号': space.plateNumber || '-',
    }));
    exportToExcel(exportData, `车位管理_${new Date().toISOString().slice(0, 10)}`);

    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '导出数据',
      detail: '导出车位管理列表',
    });
  };

  const filteredSpaces = spaces.filter(space => {
    if (statusFilter !== 'all' && space.status !== statusFilter) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        space.spaceNumber.toLowerCase().includes(search) ||
        space.employeeName?.toLowerCase().includes(search) ||
        space.plateNumber?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getSpaceColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success-100 dark:bg-success-900/30 border-success-300 text-success-700 dark:text-success-300';
      case 'occupied':
        return 'bg-danger-100 dark:bg-danger-900/30 border-danger-300 text-danger-700 dark:text-danger-300';
      case 'reserved':
        return 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 text-primary-700 dark:text-primary-300';
      case 'maintenance':
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 text-neutral-600 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300';
    }
  };

  const getSpaceIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={20} />;
      case 'occupied':
        return <Car size={20} />;
      case 'reserved':
        return <Clock size={20} />;
      case 'maintenance':
        return <AlertTriangle size={20} />;
      default:
        return <MapPin size={20} />;
    }
  };

  const getZoneStats = (zone: ParkingZone) => {
    const usageRate = zone.totalSpaces > 0 ? (zone.usedSpaces / zone.totalSpaces * 100).toFixed(1) : '0';
    return {
      usageRate,
      available: zone.totalSpaces - zone.usedSpaces,
    };
  };

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
            车位管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看和管理所有停车位的使用状态
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
          <button
            onClick={() => fetchSpaces(selectedZone === 'all' ? undefined : selectedZone)}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw size={18} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones.map(zone => {
          const stats = getZoneStats(zone);
          return (
            <div
              key={zone.zoneId}
              className={`card p-5 cursor-pointer transition-all hover:shadow-lg ${
                selectedZone === zone.zoneId
                  ? 'ring-2 ring-primary-500'
                  : ''
              }`}
              onClick={() => handleZoneChange(zone.zoneId)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-800 dark:text-white">
                  {zone.zoneName}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  zone.isFixed
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                }`}>
                  {zone.isFixed ? '固定车位' : '临时车位'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                    {zone.totalSpaces}
                  </p>
                  <p className="text-xs text-neutral-500">总车位</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success-600">
                    {stats.available}
                  </p>
                  <p className="text-xs text-neutral-500">空闲</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.usageRate}%
                  </p>
                  <p className="text-xs text-neutral-500">使用率</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${stats.usageRate}%` }}
                />
              </div>
            </div>
          );
        })}
        <div
          className={`card p-5 cursor-pointer transition-all hover:shadow-lg ${
            selectedZone === 'all' ? 'ring-2 ring-primary-500' : ''
          }`}
          onClick={() => handleZoneChange('all')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-neutral-800 dark:text-white">
              全部区域
            </h3>
            <Settings size={20} className="text-neutral-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                {zones.reduce((sum, z) => sum + z.totalSpaces, 0)}
              </p>
              <p className="text-xs text-neutral-500">总车位</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {zones.reduce((sum, z) => sum + (z.totalSpaces - z.usedSpaces), 0)}
              </p>
              <p className="text-xs text-neutral-500">空闲</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {zones.length > 0
                  ? (zones.reduce((sum, z) => sum + z.usedSpaces, 0) /
                    zones.reduce((sum, z) => sum + z.totalSpaces, 0) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-neutral-500">使用率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索车位编号、员工姓名、车牌号..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部状态</option>
              <option value="available">空闲</option>
              <option value="occupied">已占用</option>
              <option value="reserved">已预留</option>
              <option value="maintenance">维护中</option>
            </select>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                列表
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {filteredSpaces.map(space => (
            <div
              key={space.spaceId}
              onClick={() => {
                setSelectedSpace(space);
                setShowDetailModal(true);
              }}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                getSpaceColor(space.status)
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {getSpaceIcon(space.status)}
                <span className="font-semibold text-sm">
                  {space.spaceNumber}
                </span>
                {space.plateNumber && (
                  <span className="text-xs truncate w-full text-center">
                    {space.plateNumber}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    车位编号
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    所属区域
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    车位类型
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    使用人
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">
                    车牌号
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-neutral-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredSpaces.map(space => (
                  <tr
                    key={space.spaceId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-neutral-800 dark:text-white">
                        {space.spaceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                      {space.zoneName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        space.spaceType === 'fixed'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}>
                        {space.spaceType === 'fixed' ? '固定车位' : '临时车位'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={space.status} />
                    </td>
                    <td className="px-6 py-4">
                      {space.employeeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User size={12} className="text-primary-600" />
                          </div>
                          <span className="text-neutral-800 dark:text-white">
                            {space.employeeName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={space.plateNumber ? 'text-neutral-800 dark:text-white font-mono' : 'text-neutral-400'}>
                        {space.plateNumber || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {space.status === 'occupied' && (
                          <button
                            onClick={() => {
                              setSelectedSpace(space);
                              setShowReleaseModal(true);
                            }}
                            className="text-xs text-danger-600 hover:text-danger-700"
                          >
                            释放
                          </button>
                        )}
                        {space.status !== 'maintenance' ? (
                          <button
                            onClick={() => handleStatusChange(space, 'maintenance')}
                            className="text-xs text-warning-600 hover:text-warning-700"
                          >
                            设为维护
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(space, 'available')}
                            className="text-xs text-success-600 hover:text-success-700"
                          >
                            恢复使用
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSpaces.length === 0 && (
        <div className="card p-12 text-center">
          <MapPin size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">
            暂无符合条件的车位
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={showReleaseModal}
        onClose={() => {
          setShowReleaseModal(false);
          setSelectedSpace(null);
        }}
        onConfirm={handleRelease}
        title="确认释放车位"
        message={`确定要释放车位 ${selectedSpace?.zoneName} ${selectedSpace?.spaceNumber} 吗？该车位将变为可用状态。`}
        confirmText="确认释放"
        variant="danger"
      />

      {showDetailModal && selectedSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full animate-fade-in">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  车位详情
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSpace(null);
                  }}
                  className="btn-ghost p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 ${
                  getSpaceColor(selectedSpace.status)
                }`}>
                  {getSpaceIcon(selectedSpace.status)}
                  <span className="font-bold text-lg mt-2">
                    {selectedSpace.spaceNumber}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">所属区域</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {selectedSpace.zoneName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">车位类型</p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {selectedSpace.spaceType === 'fixed' ? '固定车位' : '临时车位'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">当前状态</p>
                  <StatusBadge status={selectedSpace.status} />
                </div>
                {selectedSpace.employeeName && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">使用人</p>
                    <p className="font-medium text-neutral-800 dark:text-white">
                      {selectedSpace.employeeName}
                    </p>
                  </div>
                )}
                {selectedSpace.plateNumber && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">车牌号</p>
                    <p className="font-medium text-neutral-800 dark:text-white font-mono">
                      {selectedSpace.plateNumber}
                    </p>
                  </div>
                )}
                {selectedSpace.employeeId && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">员工工号</p>
                    <p className="font-medium text-neutral-800 dark:text-white">
                      {selectedSpace.employeeId}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                {selectedSpace.status === 'occupied' && (
                  <button
                    onClick={() => {
                      setShowReleaseModal(true);
                      setShowDetailModal(false);
                    }}
                    className="btn-danger flex-1"
                  >
                    释放车位
                  </button>
                )}
                {selectedSpace.status !== 'maintenance' ? (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedSpace, 'maintenance');
                      setShowDetailModal(false);
                    }}
                    className="btn-warning flex-1"
                  >
                    设为维护
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedSpace, 'available');
                      setShowDetailModal(false);
                    }}
                    className="btn-success flex-1"
                  >
                    恢复使用
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
