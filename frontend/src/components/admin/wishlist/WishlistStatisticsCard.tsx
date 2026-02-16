'use client';

/**
 * WishlistStatisticsCard Component
 *
 * A card component for displaying key wishlist statistics with trend indicators
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishlistStatisticsCardProps {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const WishlistStatisticsCard: React.FC<WishlistStatisticsCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  onClick,
  className
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={cn('text-sm mt-2', getTrendColor())}>
              {getTrendIcon()} {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className="ml-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
          <Icon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
        </div>
      </div>
    </div>
  );
};

export default WishlistStatisticsCard;
