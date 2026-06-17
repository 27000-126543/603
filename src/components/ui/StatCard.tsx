import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | number;
  trendValue?: string;
  trendLabel?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

const variantStyles = {
  primary: 'from-primary-500 to-blue-600',
  success: 'from-emerald-500 to-emerald-600',
  warning: 'from-amber-500 to-amber-600',
  danger: 'from-rose-500 to-rose-600',
};

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  trendLabel,
  variant,
  iconBg,
  iconColor,
  className = '',
}: StatCardProps) => {
  const isNumericTrend = typeof trend === 'number';
  const showTrendUp = isNumericTrend ? trend >= 0 : trend === 'up';
  const showTrendDown = isNumericTrend ? trend < 0 : trend === 'down';
  const hasTrend = trend !== undefined;

  const iconWrapperClass = iconBg || (variant ? `bg-gradient-to-br ${variantStyles[variant]}` : 'bg-primary-100 dark:bg-primary-900/30');
  const iconTextClass = iconColor || (variant ? 'text-white' : 'text-primary-600');

  return (
    <div className={cn('card p-6 group hover:-translate-y-1 transition-transform duration-300', className)}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300', iconWrapperClass)}>
            <span className={iconTextClass}>
              {icon}
            </span>
          </div>
        )}
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold text-neutral-800 dark:text-white font-mono">
          {value}
        </span>
      </div>
      {hasTrend && (
        <div className="flex items-center gap-1.5 text-sm">
          {showTrendUp && (
            <>
              <TrendingUp size={14} className="text-success-500" />
              {isNumericTrend ? (
                <span className="text-success-600 dark:text-success-400 font-medium">+{trend}%</span>
              ) : (
                <span className="text-success-600 dark:text-success-400 font-medium">{trendValue}</span>
              )}
            </>
          )}
          {showTrendDown && (
            <>
              <TrendingDown size={14} className="text-danger-500" />
              {isNumericTrend ? (
                <span className="text-danger-600 dark:text-danger-400 font-medium">{trend}%</span>
              ) : (
                <span className="text-danger-600 dark:text-danger-400 font-medium">{trendValue}</span>
              )}
            </>
          )}
          {(trendLabel || (trendValue && isNumericTrend)) && (
            <span className="text-neutral-500 dark:text-neutral-400">
              {trendLabel || '较上周'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
