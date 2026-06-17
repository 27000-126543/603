import { getStatusText, getStatusColor } from '@/utils/format';

interface StatusBadgeProps {
  status: string;
  showText?: boolean;
  customText?: string;
  className?: string;
}

export const StatusBadge = ({ status, showText = true, customText, className = '' }: StatusBadgeProps) => {
  const color = getStatusColor(status);
  const text = customText || getStatusText(status);

  const colorClasses: Record<string, string> = {
    success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color] || colorClasses.neutral} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        color === 'success' ? 'bg-success-500' :
        color === 'warning' ? 'bg-warning-500' :
        color === 'danger' ? 'bg-danger-500' :
        color === 'primary' ? 'bg-primary-500' : 'bg-neutral-500'
      }`} />
      {showText && text}
    </span>
  );
};
