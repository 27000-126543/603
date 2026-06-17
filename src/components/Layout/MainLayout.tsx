import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Car,
  ClipboardList,
  Receipt,
  BarChart3,
  ScrollText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getRoleText } from '@/utils/format';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, logout } = useAuthStore();
  const { isAdmin, isFinance, isEmployee } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
    { path: '/application/new', label: '申请通行证', icon: <FileText size={20} />, roles: ['employee'] },
    { path: '/application/my', label: '我的申请', icon: <ClipboardList size={20} />, roles: ['employee'] },
    { path: '/application/list', label: '申请管理', icon: <ClipboardList size={20} />, roles: ['admin'] },
    { path: '/parking/space', label: '车位管理', icon: <Car size={20} />, roles: ['admin'] },
    { path: '/parking/config', label: '车位配置', icon: <Settings size={20} />, roles: ['admin'] },
    { path: '/records/list', label: '出入记录', icon: <Car size={20} /> },
    { path: '/finance/expense', label: '费用明细', icon: <Receipt size={20} />, roles: ['admin', 'finance', 'employee'] },
    { path: '/finance/deduction', label: '扣费管理', icon: <Receipt size={20} />, roles: ['admin', 'finance'] },
    { path: '/reports/overview', label: '统计报表', icon: <BarChart3 size={20} />, roles: ['admin', 'finance'] },
    { path: '/logs/system', label: '系统日志', icon: <ScrollText size={20} />, roles: ['admin'] },
    { path: '/notifications', label: '通知中心', icon: <Bell size={20} /> },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.roles ||
    (item.roles.includes('admin') && isAdmin) ||
    (item.roles.includes('finance') && isFinance) ||
    (item.roles.includes('employee') && isEmployee)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col transition-all duration-300 fixed h-full z-40`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Car size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-neutral-800 dark:text-white">
                通行证管理
              </span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost p-2 ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} style={{ '--stagger-index': index } as React.CSSProperties}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight size={16} />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {sidebarOpen && currentUser && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-800 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <StatusBadge status={currentUser.role} customText={getRoleText(currentUser.role)} />
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost p-2 text-neutral-500 hover:text-danger-600"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <header className="h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <User size={16} />
            <span>{currentUser?.department}</span>
            <ChevronRight size={14} />
            <span className="text-neutral-800 dark:text-white font-medium">
              {filteredMenuItems.find(m => m.path === location.pathname)?.label || '系统'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="btn-ghost p-2 relative"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
