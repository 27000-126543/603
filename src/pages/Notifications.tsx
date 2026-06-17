import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle,
  AlertTriangle,
  Car,
  FileText,
  Clock,
  Calendar,
  Settings,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTime } from '@/utils/format';
import { Notification } from '@/types';

export default function Notifications() {
  const { currentUser } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, loading, addLog } = useLogStore();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (currentUser) {
      await fetchNotifications(currentUser.employeeId);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    await markAllAsRead(currentUser.employeeId);
    addLog({
      operatorId: currentUser.employeeId,
      operatorName: currentUser.name,
      operationType: '系统配置',
      detail: '标记所有通知为已读',
      ipAddress: '127.0.0.1',
    });
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'approval': <CheckCircle size={20} className="text-success-500" />,
      'rejection': <AlertTriangle size={20} className="text-danger-500" />,
      'renewal': <Clock size={20} className="text-warning-500" />,
      'expiry': <Calendar size={20} className="text-danger-500" />,
      'allocation': <Car size={20} className="text-primary-500" />,
      'deduction': <FileText size={20} className="text-warning-500" />,
      'system': <Settings size={20} className="text-neutral-500" />,
    };
    return iconMap[type] || <Bell size={20} className="text-neutral-500" />;
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white dark:bg-neutral-800';
    const bgMap: Record<string, string> = {
      'approval': 'bg-success-50 dark:bg-success-900/20',
      'rejection': 'bg-danger-50 dark:bg-danger-900/20',
      'renewal': 'bg-warning-50 dark:bg-warning-900/20',
      'expiry': 'bg-danger-50 dark:bg-danger-900/20',
      'allocation': 'bg-primary-50 dark:bg-primary-900/20',
      'deduction': 'bg-warning-50 dark:bg-warning-900/20',
      'system': 'bg-neutral-50 dark:bg-neutral-800',
    };
    return bgMap[type] || 'bg-white dark:bg-neutral-800';
  };

  const getTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'approval': '审核通过',
      'rejection': '审核拒绝',
      'renewal': '续期提醒',
      'expiry': '过期通知',
      'allocation': '车位分配',
      'deduction': '费用扣除',
      'system': '系统通知',
    };
    return labelMap[type] || '通知';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            通知中心
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看您的系统通知和消息提醒
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifications}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw size={18} />
            刷新
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-primary flex items-center gap-2"
            >
              <Check size={18} />
              全部已读
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'unread'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            未读
            {unreadCount > 0 && (
              <span className="bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            已读 ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-primary-600" />
            <div>
              <p className="font-medium text-primary-800 dark:text-primary-200">
                您有 {unreadCount} 条未读通知
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                请及时查看和处理相关事项
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredNotifications.map(notification => (
          <div
            key={notification.id}
            className={`card p-4 ${getNotificationBg(notification.type, notification.isRead)} 
              border border-neutral-200 dark:border-neutral-700
              hover:shadow-lg transition-all cursor-pointer`}
            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                notification.isRead
                  ? 'bg-neutral-100 dark:bg-neutral-700'
                  : 'bg-white dark:bg-neutral-800 shadow-sm'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      notification.isRead
                        ? 'text-neutral-600 dark:text-neutral-400'
                        : 'text-neutral-800 dark:text-white'
                    }`}>
                      {notification.title}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      notification.isRead
                        ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                        : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    }`}>
                      {getTypeLabel(notification.type)}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 flex items-center gap-1 flex-shrink-0">
                    <Clock size={12} />
                    {formatDateTime(notification.createTime)}
                  </span>
                </div>
                <p className={`text-sm ${
                  notification.isRead
                    ? 'text-neutral-500 dark:text-neutral-500'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}>
                  {notification.content}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                  className="btn-ghost p-2 flex-shrink-0"
                  title="标记已读"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="card py-16 text-center">
          <Bell size={64} className="mx-auto text-neutral-200 dark:text-neutral-700 mb-4" />
          <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            暂无{filter === 'unread' ? '未读' : filter === 'read' ? '已读' : ''}通知
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            {filter === 'unread'
              ? '您的所有通知都已阅读完毕'
              : filter === 'read'
              ? '您还没有已读的通知'
              : '您还没有收到任何通知'}
          </p>
        </div>
      )}
    </div>
  );
}

function ChevronRight({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
