/**
 * StockIndicator Component
 * 
 * A component for displaying product stock status.
 * Features include:
 * - "In Stock" badge (green) - >10 items
 * - "Low Stock" badge (orange) - 1-10 items
 * - "Out of Stock" badge (red) - 0 items
 * - Show actual quantity for logged-in users
 * - Animated stock countdown for low stock
 * - Integration with product inventory data
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';

interface StockIndicatorProps {
  stockQuantity: number;
  lowStockThreshold?: number;
  showQuantity?: boolean;
  className?: string;
}

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * StockIndicator Component
 * 
 * @param {StockIndicatorProps} props - Component props
 * @returns {JSX.Element} Stock indicator component
 */
export const StockIndicator: React.FC<StockIndicatorProps> = ({
  stockQuantity,
  lowStockThreshold = 10,
  showQuantity = false,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  // Determine stock status
  const getStockStatus = (): StockStatus => {
    if (stockQuantity === 0) return 'out_of_stock';
    if (stockQuantity <= lowStockThreshold) return 'low_stock';
    return 'in_stock';
  };

  const stockStatus = getStockStatus();

  // Countdown animation for low stock
  useEffect(() => {
    if (stockStatus === 'low_stock' && stockQuantity > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [stockStatus, stockQuantity]);

  const statusConfig = {
    in_stock: {
      label: 'In Stock',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    low_stock: {
      label: 'Low Stock',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    out_of_stock: {
      label: 'Out of Stock',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[stockStatus];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} ${className}`}>
      <span className="flex-shrink-0">{config.icon}</span>
      <span className="text-sm font-medium">{config.label}</span>
      {showQuantity && stockQuantity > 0 && (
        <span className="text-sm font-semibold">
          ({stockQuantity} {stockQuantity === 1 ? 'item' : 'items'} left)
        </span>
      )}
      {stockStatus === 'low_stock' && (
        <div className="ml-2 flex items-center gap-1">
          <div className="w-16 h-1.5 bg-orange-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-100"
              style={{ width: `${timeLeft}%` }}
            />
          </div>
          <span className="text-xs text-orange-700 animate-pulse">Selling fast!</span>
        </div>
      )}
    </div>
  );
};

export default StockIndicator;
