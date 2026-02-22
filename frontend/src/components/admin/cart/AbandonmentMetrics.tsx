'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { AbandonmentMetrics } from '@/lib/api/cartAnalytics';

interface AbandonmentMetricsProps {
  data: AbandonmentMetrics;
  language?: 'en' | 'bn';
}

const AbandonmentMetrics: React.FC<AbandonmentMetricsProps> = ({ data, language = 'en' }) => {
  const { 
    totalCarts, 
    abandonedCarts, 
    convertedCarts, 
    activeCarts, 
    abandonmentRate, 
    trend, 
    topAbandonmentReasons 
  } = data;

  const translations = {
    en: {
      summary: 'Summary',
      trend: '30-Day Trend',
      topReasons: 'Top Abandonment Reasons',
      total: 'Total Carts',
      abandoned: 'Abandoned',
      converted: 'Converted',
      active: 'Active',
      rate: 'Abandonment Rate',
      date: 'Date',
      reason: 'Reason',
      count: 'Count',
      noReasons: 'No abandonment reasons recorded',
      recovering: 'Recovering',
      increasing: 'Increasing',
      stable: 'Stable'
    },
    bn: {
      summary: 'সারসংক্ষেপ',
      trend: '৩০ দিনের ট্রেন্ড',
      topReasons: 'শীর্ষ পরিত্যাগ কারণ',
      total: 'মোট কার্ট',
      abandoned: 'পরিত্যাগ করা',
      converted: 'রূপান্তরিত',
      active: 'সক্রিয়',
      rate: 'পরিত্যাগ হার',
      date: 'তারিখ',
      reason: 'কারণ',
      count: 'সংখ্যা',
      noReasons: 'কোন পরিত্যাগ কারণ রেকর্ড করা হয়নি',
      recovering: 'পুনরুদ্ধার হচ্ছে',
      increasing: 'বৃদ্ধি পাচ্ছে',
      stable: 'স্থিতিশীল'
    }
  };

  const t = translations[language];

  // Calculate trend direction
  const recentTrend = trend.slice(-7);
  const avgRecentRate = recentTrend.reduce((sum, day) => sum + day.abandonmentRate, 0) / recentTrend.length;
  const avgOlderRate = trend.slice(-14, -7).reduce((sum, day) => sum + day.abandonmentRate, 0) / 7;
  
  let trendDirection = t.stable;
  let trendColor = 'text-gray-600';
  let TrendIcon = Clock;
  
  if (avgRecentRate < avgOlderRate - 5) {
    trendDirection = t.recovering;
    trendColor = 'text-green-600';
    TrendIcon = TrendingDown;
  } else if (avgRecentRate > avgOlderRate + 5) {
    trendDirection = t.increasing;
    trendColor = 'text-red-600';
    TrendIcon = TrendingUp;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">{t.total}</div>
          <div className="text-2xl font-bold text-blue-600">{totalCarts.toLocaleString()}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">{t.abandoned}</div>
          <div className="text-2xl font-bold text-red-600">{abandonedCarts.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">{t.converted}</div>
          <div className="text-2xl font-bold text-green-600">{convertedCarts.toLocaleString()}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">{t.active}</div>
          <div className="text-2xl font-bold text-yellow-600">{activeCarts.toLocaleString()}</div>
        </div>
      </div>

      {/* Abandonment Rate */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">{t.rate}</span>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm">{trendDirection}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900">{abandonmentRate.toFixed(2)}%</div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  abandonmentRate > 70 ? 'bg-red-500' : 
                  abandonmentRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(abandonmentRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">{t.trend}</h4>
        <div className="h-32 flex items-end gap-1">
          {trend.slice(-14).map((day, index) => (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center"
            >
              <div 
                className={`w-full transition-all duration-300 ${
                  day.abandonmentRate > 70 ? 'bg-red-400' : 
                  day.abandonmentRate > 50 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ 
                  height: `${Math.max(day.abandonmentRate * 0.8, 4)}px`,
                  minHeight: '4px'
                }}
                title={`${day.date}: ${day.abandonmentRate.toFixed(2)}%`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{trend[trend.length - 14]?.date}</span>
          <span>{trend[trend.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Abandonment Reasons */}
      {topAbandonmentReasons.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">{t.topReasons}</h4>
          <div className="space-y-2">
            {topAbandonmentReasons.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{item.reason}</span>
                </div>
                <span className="text-sm font-medium bg-white px-2 py-1 rounded">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topAbandonmentReasons.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{t.noReasons}</p>
        </div>
      )}
    </div>
  );
};

export default AbandonmentMetrics;
