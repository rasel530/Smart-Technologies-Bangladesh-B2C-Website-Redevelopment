'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Users,
  Mail
} from 'lucide-react';

interface RecoveryTrend {
  date: string;
  recovered: number;
  abandoned: number;
  rate: number;
}

interface RecentRecovered {
  cartId: string;
  userEmail: string | null;
  userName: string;
  recoveredAt: string;
  recoveryCount: number;
}

interface RecoveryStats {
  totalCarts: number;
  abandonedCarts: number;
  recoveredCarts: number;
  activeCarts: number;
  convertedCarts: number;
  recoveryRate: number;
  avgRecoveryTimeHours: number;
  recentRecovered: RecentRecovered[];
  trends: RecoveryTrend[];
}

interface RecoveryDashboardProps {
  language?: 'en' | 'bn';
  onViewCart?: (cartId: string) => void;
  onBulkRecover?: () => void;
}

const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({
  language = 'en',
  onViewCart,
  onBulkRecover
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  const translations = {
    en: {
      recoveryDashboard: 'Recovery Dashboard',
      overview: 'Overview',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      totalCarts: 'Total Carts',
      abandonedCarts: 'Abandoned Carts',
      recoveredCarts: 'Recovered Carts',
      activeCarts: 'Active Carts',
      convertedCarts: 'Converted Carts',
      recoveryRate: 'Recovery Rate',
      avgRecoveryTime: 'Avg Recovery Time',
      hours: 'hours',
      recentRecoveries: 'Recent Recoveries',
      viewAll: 'View All',
      trends: 'Recovery Trends',
      noData: 'No data available',
      abandoned: 'Abandoned',
      recovered: 'Recovered',
      rate: 'Rate',
      cart: 'Cart',
      converted: 'converted',
      bulkActions: 'Bulk Actions',
      recoverAll: 'Recover All Abandoned',
      sendReminders: 'Send Reminders',
      performance: 'Performance',
      excellent: 'Excellent',
      good: 'Good',
      needsAttention: 'Needs Attention'
    },
    bn: {
      recoveryDashboard: 'পুনরুদ্ধার ড্যাশবোর্ড',
      overview: 'সামগ্রিক দৃশ্য',
      today: 'আজ',
      week: 'এই সপ্তাহ',
      month: 'এই মাস',
      totalCarts: 'মোট কার্ট',
      abandonedCarts: 'পরিত্যক্ত কার্ট',
      recoveredCarts: 'পুনরুদ্ধার করা কার্ট',
      activeCarts: 'সক্রিয় কার্ট',
      convertedCarts: 'রূপান্তরিত কার্ট',
      recoveryRate: 'পুনরুদ্ধার হার',
      avgRecoveryTime: 'গড় পুনরুদ্ধার সময়',
      hours: 'ঘণ্টা',
      recentRecoveries: 'সাম্প্রতিক পুনরুদ্ধার',
      viewAll: 'সব দেখুন',
      trends: 'পুনরুদ্ধার প্রবণতা',
      noData: 'কোনো ডেটা নেই',
      abandoned: 'পরিত্যক্ত',
      recovered: 'পুনরুদ্ধার',
      rate: 'হার',
      cart: 'কার্ট',
      converted: 'রূপান্তরিত',
      bulkActions: 'বাল্ক অ্যাকশন',
      recoverAll: 'সব পরিত্যক্ত পুনরুদ্ধার করুন',
      sendReminders: 'রিমাইন্ডার পাঠান',
      performance: 'পারফরম্যান্স',
      excellent: 'চমৎকার',
      good: 'ভালো',
      needsAttention: 'মনোযোগ প্রয়োজন'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/v1/admin/carts/recovery/stats?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching recovery stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerformanceRating = (rate: number) => {
    if (rate >= 50) return { label: t.excellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 25) return { label: t.good, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: t.needsAttention, color: 'text-red-600', bg: 'bg-red-100' };
  };

  const maxTrendValue = Math.max(
    ...(stats?.trends?.map(t => Math.max(t.recovered, t.abandoned)) || [1])
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>{t.noData}</p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceRating(stats.recoveryRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.recoveryDashboard}</h1>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'today', label: t.today },
            { key: 'week', label: t.week },
            { key: 'month', label: t.month }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setDateRange(option.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === option.key
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Carts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.totalCarts}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCarts}</p>
            </div>
          </div>
        </div>

        {/* Abandoned Carts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.abandonedCarts}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.abandonedCarts}</p>
            </div>
          </div>
        </div>

        {/* Recovered Carts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.recoveredCarts}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recoveredCarts}</p>
            </div>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${performance.bg}`}>
              <TrendingUp className={`w-6 h-6 ${performance.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.recoveryRate}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{stats.recoveryRate}%</p>
                <span className={`text-xs font-medium ${performance.color}`}>
                  {performance.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t.trends}</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-600">{t.abandoned}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">{t.recovered}</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3">
            {stats.trends.slice(-7).map((trend, index) => (
              <div key={trend.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-500">
                  {new Date(trend.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {/* Abandoned Bar */}
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${(trend.abandoned / maxTrendValue) * 100}%` }}
                    />
                  </div>
                  {/* Recovered Bar */}
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(trend.recovered / maxTrendValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="text-green-600 font-medium">{trend.recovered}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-yellow-600">{trend.abandoned}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{t.avgRecoveryTime}:</span>
                <span className="font-medium text-gray-900">{stats.avgRecoveryTimeHours} {t.hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{t.performance}:</span>
                <span className={`font-medium ${performance.color}`}>{performance.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Recoveries */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.recentRecoveries}</h2>
            <button
              onClick={() => onViewCart && onViewCart('all')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              {t.viewAll}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentRecovered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>{t.noData}</p>
              </div>
            ) : (
              stats.recentRecovered.slice(0, 5).map((recovery, index) => (
                <div
                  key={recovery.cartId || index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onViewCart && onViewCart(recovery.cartId)}
                >
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {recovery.userName || recovery.userEmail || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(recovery.recoveredAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{t.cart}</p>
                    <p className="text-xs text-gray-400">#{recovery.cartId.slice(0, 8)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {stats.abandonedCarts > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t.bulkActions}</h3>
                <p className="text-sm text-gray-500">
                  {stats.abandonedCarts} {t.abandoned} {t.cart}s available for recovery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBulkRecover}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                {t.recoverAll}
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors">
                <Mail className="w-5 h-5" />
                {t.sendReminders}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.activeCarts}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCarts}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.converted}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.convertedCarts}</p>
            </div>
            <ArrowRight className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryDashboard;
