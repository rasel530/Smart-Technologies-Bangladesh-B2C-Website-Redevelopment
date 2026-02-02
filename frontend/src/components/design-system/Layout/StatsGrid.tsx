import { HTMLAttributes } from 'react';
import { cn } from '../utilities/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface StatsGridProps extends HTMLAttributes<HTMLDivElement> {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
}

const colorVariants = {
  default: 'bg-white border border-neutral-200',
  primary: 'bg-white border border-primary-200',
  success: 'bg-white border border-green-200',
  warning: 'bg-white border border-yellow-200',
  danger: 'bg-white border border-red-200',
};

const iconColorVariants = {
  default: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
};

const gridCols = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
};

export const StatsGrid = ({ stats, columns = 4, className, ...props }: StatsGridProps) => {
  return (
    <div className={cn('grid gap-6', gridCols[columns], className)} {...props}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            'rounded-xl p-6 shadow-sm',
            colorVariants[stat.color || 'default']
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">{stat.value}</p>
              {stat.trend && (
                <p
                  className={cn(
                    'mt-2 text-sm font-medium',
                    stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                </p>
              )}
            </div>
            {stat.icon && (
              <div
                className={cn(
                  'p-3 rounded-full',
                  iconColorVariants[stat.color || 'default']
                )}
              >
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
