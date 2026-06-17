import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Info,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { validatePlateNumber, formatPlateNumber } from '@/utils/format';

const schema = z.object({
  plateNumber: z.string()
    .nonempty('请输入车牌号')
    .refine(validatePlateNumber, '车牌号格式不正确'),
  vehicleType: z.string().nonempty('请选择车辆类型'),
  ownerName: z.string().nonempty('请输入车主姓名'),
  engineNumber: z.string().nonempty('请输入发动机号'),
});

type FormData = z.infer<typeof schema>;

const vehicleTypes = [
  { value: 'sedan', label: '轿车' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: '货车' },
  { value: 'motorcycle', label: '摩托车' },
  { value: 'other', label: '其他' },
];

export default function NewApplication() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { submitApplication, loading } = useApplicationStore();
  const { addLog } = useLogStore();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      plateNumber: '',
      vehicleType: '',
      ownerName: currentUser?.name || '',
      engineNumber: '',
    },
  });

  const plateNumber = watch('plateNumber');

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPlateNumber(e.target.value);
    setValue('plateNumber', value, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    const result = await submitApplication(currentUser.employeeId, {
      ...data,
      plateNumber: formatPlateNumber(data.plateNumber),
    });

    setSubmitResult(result);

    if (result.success && result.data) {
      addLog({
        operatorId: currentUser.employeeId,
        operatorName: currentUser.name,
        operationType: '提交申请',
        detail: `提交通行证申请 ${result.data.applicationId}，车牌号 ${result.data.plateNumber}`,
      });

      if (result.data.parkingZoneName && result.data.parkingSpaceNumber) {
        addLog({
          operatorId: currentUser.employeeId,
          operatorName: currentUser.name,
          operationType: '分配车位',
          detail: `自动分配车位 ${result.data.parkingZoneName} ${result.data.parkingSpaceNumber} 给申请 ${result.data.applicationId}`,
        });
      }

      setTimeout(() => {
        navigate('/application/my');
      }, 2000);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-neutral-500">请先登录</p>
      </div>
    );
  }

  if (submitResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            submitResult.success
              ? 'bg-success-100 dark:bg-success-900/30'
              : 'bg-danger-100 dark:bg-danger-900/30'
          }`}>
            {submitResult.success ? (
              <CheckCircle size={32} className="text-success-600" />
            ) : (
              <AlertCircle size={32} className="text-danger-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
            {submitResult.success ? '提交成功' : '提交失败'}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {submitResult.message}
          </p>
          {submitResult.success && submitResult.data && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">申请编号：</span>
                  <span className="font-medium text-neutral-800 dark:text-white">
                    {submitResult.data.applicationId}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">申请状态：</span>
                  <StatusBadge status={submitResult.data.status} />
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">车牌号：</span>
                  <span className="font-medium text-neutral-800 dark:text-white">
                    {submitResult.data.plateNumber}
                  </span>
                </div>
                {submitResult.data.parkingZoneName && (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">分配车位：</span>
                    <span className="font-medium text-neutral-800 dark:text-white">
                      {submitResult.data.parkingZoneName} {submitResult.data.parkingSpaceNumber}
                    </span>
                  </div>
                )}
                {submitResult.data.estimatedWaitHours && (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">预计等待：</span>
                    <span className="font-medium text-neutral-800 dark:text-white">
                      约{submitResult.data.estimatedWaitHours}小时
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            页面即将跳转到我的申请列表...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
          申请车辆通行证
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          请填写车辆信息，系统将自动校验行驶证与身份信息一致性
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <Info size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-700 dark:text-primary-300">
            <p className="font-medium mb-1">申请须知</p>
            <ul className="space-y-1 opacity-90">
              <li>• 行驶证车主姓名需与员工本人姓名一致</li>
              <li>• 系统将根据您的职级和部门自动分配车位</li>
              <li>• 通行证有效期为6个月，到期前7天会提醒续期</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <FileText size={20} className="text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
            车辆信息
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              车牌号 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              {...register('plateNumber')}
              onChange={handlePlateChange}
              value={plateNumber}
              placeholder="请输入车牌号，如：京A12345"
              className="input"
              maxLength={8}
            />
            {errors.plateNumber && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.plateNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              车辆类型 <span className="text-danger-500">*</span>
            </label>
            <select {...register('vehicleType')} className="input">
              <option value="">请选择车辆类型</option>
              {vehicleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.vehicleType && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.vehicleType.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              车主姓名 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              {...register('ownerName')}
              placeholder="请输入行驶证上的车主姓名"
              className="input"
            />
            {errors.ownerName && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.ownerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              发动机号 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              {...register('engineNumber')}
              placeholder="请输入发动机号"
              className="input"
            />
            {errors.engineNumber && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.engineNumber.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            行驶证照片 <span className="text-neutral-400">(可选)</span>
          </label>
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
            <Upload size={32} className="mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              点击或拖拽上传行驶证照片
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              支持 JPG、PNG 格式，大小不超过 5MB
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-ghost"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                提交中...
              </>
            ) : (
              <>
                <Car size={18} />
                提交申请
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
