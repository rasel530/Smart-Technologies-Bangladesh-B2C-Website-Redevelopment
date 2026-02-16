'use client';

/**
 * WishlistAnalyticsChart Component
 *
 * A chart component for displaying wishlist analytics data
 * Supports line, bar, and pie chart types with interactive features
 */

import React, { useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Download, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: AnalyticsDataPoint;
  dataKey: string;
}

interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface WishlistAnalyticsChartProps {
  data: AnalyticsDataPoint[];
  type: 'line' | 'bar' | 'pie';
  title: string;
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  className?: string;
  onExport?: () => void;
  onExpand?: () => void;
  height?: number;
}

const DEFAULT_COLORS = [
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

/**
 * Custom tooltip component - defined outside to prevent recreation on every render
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: TooltipPayload, index: number) => (
          <p key={`${entry.name}-${entry.dataKey}-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Error boundary component for the chart
 */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Failed to render chart</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const WishlistAnalyticsChart: React.FC<WishlistAnalyticsChartProps> = ({
  data,
  type,
  title,
  dataKey = 'value',
  xAxisKey = 'name',
  colors = DEFAULT_COLORS,
  className,
  onExport,
  onExpand,
  height = 300
}) => {
  /**
   * Validate data
   */
  const isValidData = useMemo(() => {
    return Array.isArray(data) && data.length > 0 && data.every(
      (item) => item && typeof item === 'object' && 'name' in item && 'value' in item
    );
  }, [data]);

  /**
   * Render chart based on type - memoized to prevent recreation on every render
   */
  const renderChart = useCallback(() => {
    if (!isValidData) {
      return null;
    }

    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => name ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${entry.value}-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  }, [type, data, dataKey, xAxisKey, colors, isValidData]);

  /**
   * Render empty state when data is invalid
   */
  if (!isValidData) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartErrorBoundary>
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <div className="flex items-center gap-2">
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                title="Export chart"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                title="Expand chart"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </ChartErrorBoundary>
  );
};

export default WishlistAnalyticsChart;
