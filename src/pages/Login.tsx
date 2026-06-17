import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Car, User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ employeeId?: string; password?: string; general?: string }>({});
  const { login, loading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!employeeId.trim()) {
      newErrors.employeeId = '请输入工号';
    }
    if (!password.trim()) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ employeeId: employeeId.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      // 错误已在store中处理
    }
  };

  const handleDemoLogin = async (id: string) => {
    setEmployeeId(id);
    setPassword('123456');
    try {
      await login({ employeeId: id, password: '123456' });
      navigate(from, { replace: true });
    } catch (err) {
      // 错误已在store中处理
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-primary rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl flex bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between bg-gradient-to-br from-primary-600/30 to-primary-800/30">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Car size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">车辆通行证管理系统</h1>
                <p className="text-primary-200 text-sm">Vehicle Pass Management</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="animate-slide-up" style={{ '--stagger-index': 0 } as React.CSSProperties}>
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                  智能停车<br />
                  <span className="text-primary-300">高效管理</span>
                </h2>
                <p className="text-primary-100/80 text-lg leading-relaxed">
                  自动化通行证申请、智能车位分配、精准超时计费、可视化统计报表，让企业停车场管理更轻松。
                </p>
              </div>

              <div className="space-y-4 animate-slide-up" style={{ '--stagger-index': 1 } as React.CSSProperties}>
                {[
                  { text: '行驶证自动校验，申请秒级通过' },
                  { text: '职级部门智能分配，固定临时合理规划' },
                  { text: '超时自动计费，工资一键扣除' },
                  { text: '多维度报表分析，辅助管理决策' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-white/60 text-sm animate-slide-up" style={{ '--stagger-index': 2 } as React.CSSProperties}>
            © 2026 车辆通行证管理系统 · 企业版
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">通行证管理系统</h1>
                <p className="text-primary-200 text-xs">Vehicle Pass Management</p>
              </div>
            </div>

            <div className="mb-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
              <p className="text-primary-200/80">请输入您的工号和密码登录系统</p>
            </div>

            {(error || errors.general) && (
              <div className="mb-6 p-4 bg-danger-500/20 border border-danger-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
                <AlertCircle size={20} className="text-danger-400 flex-shrink-0" />
                <span className="text-danger-200 text-sm">{error || errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-slide-up" style={{ '--stagger-index': 1 } as React.CSSProperties}>
                <label className="label text-white/80">工号</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="请输入工号"
                    className={`input pl-10 bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 ${errors.employeeId ? 'input-error' : ''}`}
                  />
                </div>
                {errors.employeeId && (
                  <p className="mt-1.5 text-sm text-danger-400">{errors.employeeId}</p>
                )}
              </div>

              <div className="animate-slide-up" style={{ '--stagger-index': 2 } as React.CSSProperties}>
                <label className="label text-white/80">密码</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className={`input pl-10 bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 ${errors.password ? 'input-error' : ''}`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-danger-400">{errors.password}</p>
                )}
              </div>

              <div className="animate-slide-up" style={{ '--stagger-index': 3 } as React.CSSProperties}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 text-base bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <><LoadingSpinner size="sm" /> 登录中...</>
                  ) : (
                    <><LogIn size={18} /> 登 录</>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 animate-slide-up" style={{ '--stagger-index': 4 } as React.CSSProperties}>
              <p className="text-white/60 text-sm mb-3 text-center">快速体验（密码均为 123456）</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoLogin('E001')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-all border border-white/10"
                >
                  <p className="text-white font-medium text-sm">员工</p>
                  <p className="text-white/60 text-xs">E001</p>
                </button>
                <button
                  onClick={() => handleDemoLogin('E002')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-all border border-white/10"
                >
                  <p className="text-white font-medium text-sm">行政</p>
                  <p className="text-white/60 text-xs">E002</p>
                </button>
                <button
                  onClick={() => handleDemoLogin('E003')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-all border border-white/10"
                >
                  <p className="text-white font-medium text-sm">财务</p>
                  <p className="text-white/60 text-xs">E003</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
