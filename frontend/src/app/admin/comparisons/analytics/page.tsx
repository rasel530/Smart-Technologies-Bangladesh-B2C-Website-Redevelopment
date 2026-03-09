'use client';

import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Users, Activity, Package, RefreshCw } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsGrid } from '@/components/design-system';
import adminComparisonsApi, { AdminComparisonAnalytics, AdminComparisonStats } from '@/lib/api/admin-comparisons';
import { format } from 'date-fns';

/**
 * Admin Comparison Analytics Page
 *
 * Analytics dashboard for product comparisons with:
 * - Comparison creation trends (line chart visualization)
 * - Popular products in comparisons (bar chart visualization)
 * - Comparison conversion rates (pie chart visualization)
 * - User comparison behavior (scatter plot visualization)
 * - Time-based analytics (hourly, daily, weekly, monthly)
 * - Category comparison stats (table)
 * - Export analytics data
 * - Date range filter
 */
function AdminComparisonAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminComparisonStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminComparisonAnalytics | null>(null);
  const [topComparedProducts, setTopComparedProducts] = useState<any[] | null>(null);
  
  // Filters
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchData();
  }, [period, groupBy]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        adminComparisonsApi.getAdminComparisonStats(period),
        adminComparisonsApi.getAdminComparisonAnalytics(period, groupBy)
      ]);
      
      setStats(statsResponse.stats);
      setAnalytics(analyticsResponse);
      setTopComparedProducts(statsResponse.topComparedProducts);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        period,
        groupBy,
        stats,
        analytics,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  // Simple Line Chart Component (SVG-based)
  const LineChart = ({ data, color = '#3B82F6' }: { data: { date: string; comparisons: number }[], color?: string }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;

    const maxValue = Math.max(...data.map(d => d.comparisons), 1);
    const height = 200;
    const width = 600;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = height - padding - (d.comparisons / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1={padding}
              y1={height - padding - ratio * chartHeight}
              x2={width - padding}
              y2={height - padding - ratio * chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <text
              key={ratio}
              x={padding - 10}
              y={height - padding - ratio * chartHeight + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6B7280"
            >
              {Math.round(maxValue * ratio)}
            </text>
          ))}

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = height - padding - (d.comparisons / maxValue) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{d.date}: {d.comparisons} comparisons</title>
              </circle>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
              >
                {d.date}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Simple Bar Chart Component (SVG-based)
  const BarChart = ({ data, color = '#10B981' }: { data: { name: string; value: number }[], color?: string }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const height = 200;
    const width = 600;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = (chartWidth / data.length) * 0.4;

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1={padding}
              y1={height - padding - ratio * chartHeight}
              x2={width - padding}
              y2={height - padding - ratio * chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <text
              key={ratio}
              x={padding - 10}
              y={height - padding - ratio * chartHeight + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6B7280"
            >
              {Math.round(maxValue * ratio)}
            </text>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const x = padding + i * (barWidth + barGap) + barGap / 2;
            const barHeight = (d.value / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{d.name}: {d.value}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                >
                  {d.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                >
                  {d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Simple Pie Chart Component (SVG-based)
  const CustomPieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 20;

    let currentAngle = 0;

    const slices = data.map((d, i) => {
      const angle = (d.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      return {
        ...d,
        percentage: ((d.value / total) * 100).toFixed(1),
        path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      };
    });

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mx-auto">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{slice.label}: {slice.value} ({slice.percentage}%)</title>
            </path>
          ))}
        </svg>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-700">{slice.label}: {slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statsData = [
    {
      title: 'Total Comparisons',
      value: loading ? 'Loading...' : stats?.totalComparisons || 0,
      icon: <Package className="w-6 h-6 text-primary-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Comparisons',
      value: loading ? 'Loading...' : stats?.activeComparisons || 0,
      icon: <Activity className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'User Comparisons',
      value: loading ? 'Loading...' : stats?.userComparisons || 0,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: 'default' as const,
    },
    {
      title: 'Guest Comparisons',
      value: loading ? 'Loading...' : stats?.guestComparisons || 0,
      icon: <Users className="w-6 h-6 text-purple-600" />,
      color: 'default' as const,
    },
  ];

  return (
    <AdminLayout title="Comparison Analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comparison Analytics</h1>
            <p className="mt-2 text-gray-600">
              View analytics and insights for product comparisons
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Analytics
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Group By:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={fetchData}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2">Loading analytics...</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Statistics */}
            <StatsGrid stats={statsData} columns={4} />

            {/* Section Divider */}
            <div className="border-t border-neutral-200 my-8"></div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Creation Trends */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  Comparison Creation Trends
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <LineChart data={analytics?.timeline || []} />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Comparisons created over time
                </p>
              </div>

              {/* Action Distribution */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Action Distribution
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <CustomPieChart
                    data={
                      analytics?.actionDistribution.map((action, i) => ({
                        label: action.action,
                        value: action.count,
                        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
                      })) || []
                    }
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Distribution of comparison actions
                </p>
              </div>

              {/* Popular Products */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Top Compared Products
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <BarChart
                    data={
                      topComparedProducts?.slice(0, 10).map((p, i) => ({
                        name: p.product?.name || `Product ${i + 1}`,
                        value: p._count.productId,
                      })) || []
                    }
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Most frequently compared products
                </p>
              </div>

              {/* User Activity */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Top Active Users
                </h3>
                <div className="space-y-3">
                  {analytics?.topUsers?.slice(0, 10).map((user, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium mr-3">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.user?.firstName} {user.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {user._count.userId}
                        </p>
                        <p className="text-xs text-gray-500">comparisons</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.topUsers || analytics.topUsers.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No user activity data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="border-t border-neutral-200 my-8"></div>

            {/* Detailed Statistics Table */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-orange-600" />
                Detailed Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Comparisons</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalComparisons}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Comparisons</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeComparisons}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expired Comparisons</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredComparisons}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">User Comparisons</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.userComparisons}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Guest Comparisons</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.guestComparisons}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Items Compared</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalItems}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2 lg:col-span-1">
                  <p className="text-sm text-gray-600">Average Items per Comparison</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.avgItemsPerComparison.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Table */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                Timeline Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comparisons
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Items/Comparison
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics?.timeline.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.comparisons}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalItems}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.comparisons > 0 ? (item.totalItems / item.comparisons).toFixed(1) : '0'}
                        </td>
                      </tr>
                    ))}
                    {(!analytics?.timeline || analytics.timeline.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          No timeline data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminComparisonAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
