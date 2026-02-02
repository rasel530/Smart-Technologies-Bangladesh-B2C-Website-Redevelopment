import React from 'react';
import { cn } from '../utilities/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The color variant of the badge
   * @default 'neutral'
   */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral' | 'info';
  
  /**
   * The size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the badge is outlined (transparent background with colored border)
   * @default false
   */
  outlined?: boolean;
  
  /**
   * The content to display inside the badge
   */
  children: React.ReactNode;
}

const colorClasses = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-500 text-white',
  success: 'bg-green-500 text-white',
  danger: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  neutral: 'bg-gray-200 text-gray-800',
  info: 'bg-blue-400 text-white',
};

const outlinedColorClasses = {
  primary: 'border-blue-500 text-blue-500',
  secondary: 'border-gray-500 text-gray-500',
  success: 'border-green-500 text-green-500',
  danger: 'border-red-500 text-red-500',
  warning: 'border-yellow-500 text-yellow-500',
  neutral: 'border-gray-300 text-gray-600',
  info: 'border-blue-400 text-blue-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  color = 'neutral',
  size = 'md',
  outlined = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';
  
  const colorClass = outlined 
    ? outlinedColorClasses[color] 
    : colorClasses[color];
  
  const sizeClass = sizeClasses[size];
  
  const borderClass = outlined ? 'border bg-transparent' : '';
  
  return (
    <div
      className={cn(
        baseClasses,
        colorClass,
        sizeClass,
        borderClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Helper function to get status badge styling
 * @param status - The status string
 * @returns The color class for the status
 */
export const getStatusBadge = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'active' || statusLower === 'success' || statusLower === 'completed') {
    return 'bg-green-100 text-green-800';
  }
  
  if (statusLower === 'inactive' || statusLower === 'disabled' || statusLower === 'pending') {
    return 'bg-gray-100 text-gray-800';
  }
  
  if (statusLower === 'error' || statusLower === 'failed' || statusLower === 'rejected') {
    return 'bg-red-100 text-red-800';
  }
  
  if (statusLower === 'warning' || statusLower === 'processing') {
    return 'bg-yellow-100 text-yellow-800';
  }
  
  if (statusLower === 'info' || statusLower === 'in_progress') {
    return 'bg-blue-100 text-blue-800';
  }
  
  return 'bg-gray-100 text-gray-800';
};

Badge.displayName = 'Badge';
