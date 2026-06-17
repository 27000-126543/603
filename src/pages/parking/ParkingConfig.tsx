import { useEffect, useState } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/utils/format';
import { ParkingZone } from '@/types';
import { mockEmployees } from '@/mock/data';

const departments = ['技术部', '产品部', '运营部', '市场部', '人事部', '财务部', '行政部', '销售部'];
const positionLevels = [
  { value: 1, label: '实习生' },
  { value: 2, label: '初级' },
  { value: 3, label: '中级' },
  { value: 4, label: '高级' },
  { value: 5, label: '主管' },
  { value: 6, label: '经理' },
  { value: 7, label: '总监' },
  { value: 8, label: '副总裁' },
  { value: 9, label: '总裁' },
];

interface ZoneForm {
  zoneId: string;
  zoneName: string;
  totalSpaces: number;
  positionLevelRequired: number;
  departmentAllowed: string[];
  isFixed: boolean;
}

export default function ParkingConfig() {
  const { currentUser } = useAuthStore();
  const { isAdmin } = usePermission();
  const { zones, loading, fetchZones, addZone, updateZone, deleteZone } = useParkingStore();
  const { addLog } = useLogStore();

  const [editingZone, setEditingZone] = useState<ParkingZone | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ParkingZone | null>(null);
  const [formData, setFormData] = useState<ZoneForm>({
    zoneId: '',
    zoneName: '',
    totalSpaces: 50,
    positionLevelRequired: 2,
    departmentAllowed: [],
    isFixed: false,
  });

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleAdd = () => {
    setIsAdding(true);
    setEditingZone(null);
    setFormData({
      zoneId: '',
      zoneName: '',
      totalSpaces: 50,
      positionLevelRequired: 2,
      departmentAllowed: [],
      isFixed: false,
    });
  };

  const handleEdit = (zone: ParkingZone) => {
    setEditingZone(zone);
    setIsAdding(false);
    setFormData({
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      totalSpaces: zone.totalSpaces,
      positionLevelRequired: zone.positionLevelRequired,
      departmentAllowed: [...zone.departmentAllowed],
      isFixed: zone.isFixed,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingZone(null);
  };

  const handleSave = async () => {
    if (!currentUser || !formData.zoneName) return;

    if (isAdding) {
      const newZone = await addZone({
        zoneName: formData.zoneName,
        totalSpaces: formData.totalSpaces,
        positionLevelRequired: formData.positionLevelRequired,
        departmentAllowed: formData.departmentAllowed,
        isFixed: formData.isFixed,
      });
      
      if (newZone) {
        addLog({
          operatorId: currentUser.employeeId,
          operatorName: currentUser.name,
          operationType: '新增停车区域',
          detail: `新增停车区域 ${newZone.zoneName}，共 ${newZone.totalSpaces} 个车位`,
        });
      }
    } else if (editingZone) {
      const updatedZone = await updateZone(editingZone.zoneId, {
        zoneName: formData.zoneName,
        totalSpaces: formData.totalSpaces,
        positionLevelRequired: formData.positionLevelRequired,
        departmentAllowed: formData.departmentAllowed,
        isFixed: formData.isFixed,
      });
      
      if (updatedZone) {
        addLog({
          operatorId: currentUser.employeeId,
          operatorName: currentUser.name,
          operationType: '修改停车区域',
          detail: `修改停车区域 ${updatedZone.zoneName} 配置`,
        });
      }
    }

    setIsAdding(false);
    setEditingZone(null);
  };

  const handleDelete = (zone: ParkingZone) => {
    setZoneToDelete(zone);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!zoneToDelete || !currentUser) return;

    const success = await deleteZone(zoneToDelete.zoneId);
    
    if (success) {
      addLog({
        operatorId: currentUser.employeeId,
        operatorName: currentUser.name,
        operationType: '删除停车区域',
        detail: `删除停车区域 ${zoneToDelete.zoneName}`,
      });
    }

    setShowDeleteModal(false);
    setZoneToDelete(null);
  };

  const toggleDepartment = (dept: string) => {
    setFormData(prev => ({
      ...prev,
      departmentAllowed: prev.departmentAllowed.includes(dept)
        ? prev.departmentAllowed.filter(d => d !== dept)
        : [...prev.departmentAllowed, dept],
    }));
  };

  const getPositionLabel = (level: number) => {
    return positionLevels.find(p => p.value === level)?.label || '未知';
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
            车位配置
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            管理停车区域配置、权限设置和车位分配规则
          </p>
        </div>
        {!isAdding && !editingZone && (
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新增区域
          </button>
        )}
      </div>

      {(isAdding || editingZone) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
              {isAdding ? '新增停车区域' : '编辑停车区域'}
            </h2>
            <button
              onClick={handleCancel}
              className="btn-ghost p-2"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                区域名称 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.zoneName}
                onChange={(e) => setFormData(prev => ({ ...prev, zoneName: e.target.value }))}
                placeholder="如：A区地下停车场"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                车位总数 <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalSpaces}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSpaces: parseInt(e.target.value) || 0 }))}
                min="1"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                最低职级要求 <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.positionLevelRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, positionLevelRequired: parseInt(e.target.value) }))}
                className="input"
              >
                {positionLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                只有该职级及以上的员工可申请此区域车位
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                车位类型
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isFixed === false}
                    onChange={() => setFormData(prev => ({ ...prev, isFixed: false }))}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">临时车位</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isFixed === true}
                    onChange={() => setFormData(prev => ({ ...prev, isFixed: true }))}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">固定车位</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                固定车位分配后长期占用，临时车位可动态调整
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              允许的部门
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {departments.map(dept => (
                <label
                  key={dept}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.departmentAllowed.includes(dept)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.departmentAllowed.includes(dept)}
                    onChange={() => toggleDepartment(dept)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{dept}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              不选择则表示所有部门均可申请
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleCancel}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.zoneName || formData.totalSpaces <= 0}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              保存配置
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map(zone => {
            const isExpanded = expandedZone === zone.zoneId;
            const usageRate = zone.totalSpaces > 0
              ? (zone.usedSpaces / zone.totalSpaces * 100).toFixed(1)
              : '0';
            const eligibleEmployees = mockEmployees.filter(e =>
              e.positionLevel >= zone.positionLevelRequired &&
              (zone.departmentAllowed.length === 0 || zone.departmentAllowed.includes(e.department))
            );

            return (
              <div
                key={zone.zoneId}
                className="card overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => setExpandedZone(isExpanded ? null : zone.zoneId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <MapPin size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-neutral-800 dark:text-white">
                            {zone.zoneName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            zone.isFixed
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {zone.isFixed ? '固定车位' : '临时车位'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          最低职级：{getPositionLabel(zone.positionLevelRequired)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                          {zone.usedSpaces}/{zone.totalSpaces}
                        </p>
                        <p className="text-xs text-neutral-500">已用/总数</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600">{usageRate}%</p>
                        <p className="text-xs text-neutral-500">使用率</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success-600">
                          {zone.totalSpaces - zone.usedSpaces}
                        </p>
                        <p className="text-xs text-neutral-500">空闲</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(zone);
                          }}
                          className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(zone);
                          }}
                          className="p-2 text-neutral-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-neutral-400" />
                        ) : (
                          <ChevronDown size={20} className="text-neutral-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${usageRate}%` }}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                          <Building2 size={16} />
                          允许的部门
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {zone.departmentAllowed.length === 0 ? (
                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm text-neutral-600 dark:text-neutral-400">
                              所有部门
                            </span>
                          ) : (
                            zone.departmentAllowed.map(dept => (
                              <span
                                key={dept}
                                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full text-sm text-primary-700 dark:text-primary-300"
                              >
                                {dept}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                          <Users size={16} />
                          符合条件的员工 ({eligibleEmployees.length}人)
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {eligibleEmployees.slice(0, 5).map(emp => (
                            <div
                              key={emp.employeeId}
                              className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-600">
                                    {emp.name.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {emp.name}
                                </span>
                              </div>
                              <span className="text-xs text-neutral-500">
                                {emp.department} · {getPositionLabel(emp.positionLevel)}
                              </span>
                            </div>
                          ))}
                          {eligibleEmployees.length > 5 && (
                            <p className="text-xs text-neutral-500 text-center py-2">
                              还有 {eligibleEmployees.length - 5} 名员工符合条件
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">区域ID</p>
                          <p className="font-medium text-neutral-800 dark:text-white">{zone.zoneId}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">创建时间</p>
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {formatDate(new Date())}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">车位类型</p>
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {zone.isFixed ? '固定车位' : '临时车位'}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">最低职级</p>
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {getPositionLabel(zone.positionLevelRequired)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {zones.length === 0 && (
            <div className="card p-12 text-center">
              <Settings size={48} className="mx-auto text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white mb-2">
                暂无停车区域配置
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                点击上方按钮添加第一个停车区域
              </p>
              <button
                onClick={handleAdd}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={18} />
                新增区域
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setZoneToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除停车区域 "${zoneToDelete?.zoneName}" 吗？此操作不可恢复，已分配的车位将被释放。`}
        confirmText="确认删除"
        variant="danger"
      />
    </div>
  );
}
