'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Mail,
  ShoppingCart,
  DollarSign,
  Clock,
  BarChart3,
  Calendar,
  Download,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

// Simple Tabs implementation
const SimpleTabs: React.FC<{ defaultValue: string; children: React.ReactNode }> = ({ 
  defaultValue, 
  children 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === SimpleTabsList) {
          return React.cloneElement(child as React.ReactElement<{ value: string; onValueChange: (v: string) => void }>, { 
            value: activeTab, 
            onValueChange: setActiveTab 
          });
        }
        if (child.type === SimpleTabsContent) {
          return React.cloneElement(child as React.ReactElement<{ value: string; activeValue: string }>, { 
            activeValue: activeTab 
          });
        }
        return child;
      })}
    </div>
  );
};

const SimpleTabsList: React.FC<{ 
  children: React.ReactNode; 
  value?: string; 
  onValueChange?: (v: string) => void;
  className?: string;
}> = ({ children, value, onValueChange, className }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className || ''}`}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<{ isActive?: boolean; onClick?: () => void }>, { 
        isActive: child.props.value === value,
        onClick: () => onValueChange?.(child.props.value)
      });
    })}
  </div>
);

const SimpleTabsTrigger: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  isActive?: boolean;
  onClick?: () => void;
}> = ({ children, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
      isActive 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const SimpleTabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  activeValue?: string;
}> = ({ value, children, activeValue }) => {
  if (value !== activeValue) return null;
  return <div className="mt-2">{children}</div>;
};

interface DiscountStats {
  withDiscount: { count: number; revenue: number };
  withoutDiscount: { count: number; revenue: number };
}

const DiscountImpactBars: React.FC<{ stats: DiscountStats }> = ({ stats }) => {
  const total = stats.withDiscount.revenue + stats.withoutDiscount.revenue;
  const withDiscountPct = total > 0 ? (stats.withDiscount.revenue / total) * 100 : 0;
  const withoutDiscountPct = total > 0 ? (stats.withoutDiscount.revenue / total) * 100 : 0;
  
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">With Discount</span>
            <span className="text-sm text-gray-500">{withDiscountPct.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${withDiscountPct}%` }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Without Discount</span>
            <span className="text-sm text-gray-500">{withoutDiscountPct.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${withoutDiscountPct}%` }} />
          </div>
        </div>
      </div>
    </>
  );
};

interface RecoveryStats {
  summary: {
    totalAbandoned: number;
    totalRecovered: number;
    totalPending: number;
    recoveryRate: number;
    totalRecoveredRevenue: number;
    averageOrderValue: number;
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
  dailyStats: {
    date: string;
    abandoned: number;
    recovered: number;
    revenue: number;
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
  }[];
  hourlyStats: {
    hour: number;
    sent: number;
    opened: number;
    clicked: number;
    recovered: number;
  }[];
  templateStats: {
    template: string;
    sent: number;
    opened: number;
    clicked: number;
    recovered: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    recoveryRate: number;
  }[];
  discountStats: {
    withDiscount: { count: number; revenue: number };
    withoutDiscount: { count: number; revenue: number };
  };
}

export default function RecoveryStatsPage() {
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.get<{
        summary: {
          totalAbandoned: number;
          totalRecovered: number;
          totalPending: number;
          recoveryRate: number;
          totalRecoveredRevenue: number;
          averageOrderValue: number;
          emailsSent: number;
          emailsOpened: number;
          emailsClicked: number;
          openRate: number;
          clickRate: number;
        };
        dailyStats: {
          date: string;
          abandoned: number;
          recovered: number;
          revenue: number;
          emailsSent: number;
          emailsOpened: number;
          emailsClicked: number;
        }[];
        templateStats: {
          template: string;
          sent: number;
          opened: number;
          clicked: number;
          recovered: number;
          revenue: number;
          openRate: number;
          clickRate: number;
          recoveryRate: number;
        }[];
        discountStats: {
          withDiscount: { count: number; revenue: number };
          withoutDiscount: { count: number; revenue: number };
        };
        hourlyStats: {
          hour: number;
          sent: number;
          opened: number;
          clicked: number;
          recovered: number;
        }[];
      }>(`/admin/carts/recovery/stats?days=${dateRange}`);
      
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!stats) return;
    
    const dataStr = JSON.stringify(stats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `recovery-stats-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/cart/recovery">
            <Button variant="outline" className="px-3">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recovery Statistics</h1>
            <p className="text-gray-500 mt-1">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/cart/recovery">
            <Button variant="outline" className="px-3">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recovery Statistics</h1>
          </div>
        </div>
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/cart/recovery">
            <Button variant="outline" className="px-3">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recovery Statistics</h1>
            <p className="text-gray-500 mt-1">
              Detailed analytics on cart recovery performance
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7', '30', '90'] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === days
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {days === '7' ? '7 Days' : days === '30' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recovery Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.summary.recoveryRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      {stats.summary.totalRecovered} carts
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.summary.averageOrderValue)}
                    </p>
                    <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                      <DollarSign className="h-3 w-3" />
                      Per recovered cart
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recovered Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.summary.totalRecoveredRevenue)}
                    </p>
                    <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                      <DollarSign className="h-3 w-3" />
                      From abandoned carts
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Abandoned Carts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.summary.totalAbandoned}
                    </p>
                    <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3" />
                      {stats.summary.totalPending} pending
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <SimpleTabs defaultValue="trends">
            <SimpleTabsList className="mb-6">
              <SimpleTabsTrigger value="trends">Trends</SimpleTabsTrigger>
              <SimpleTabsTrigger value="emails">Email Performance</SimpleTabsTrigger>
              <SimpleTabsTrigger value="discounts">Discount Impact</SimpleTabsTrigger>
            </SimpleTabsList>

            <SimpleTabsContent value="trends">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Daily Recovery Trends
                    </CardTitle>
                    <CardDescription>
                      Abandoned vs recovered carts over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.dailyStats.slice(-7).map((day, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{day.abandoned} abandoned</span>
                              <span className="text-sm text-green-600">{day.recovered} recovered</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${day.abandoned > 0 ? (day.recovered / day.abandoned) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-purple-600">
                              {formatCurrency(day.revenue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SimpleTabsContent>

            <SimpleTabsContent value="emails">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(stats.templateStats || []).map((data, index) => (
                    <Card key={data.template}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">
                          {data.template.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sent</span>
                            <span className="font-medium">{data.sent}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Opened</span>
                            <span className="font-medium">
                              {data.opened} ({data.sent > 0 ? ((data.opened / data.sent) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Clicked</span>
                            <span className="font-medium">
                              {data.clicked} ({data.sent > 0 ? ((data.clicked / data.sent) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Converted</span>
                            <span className="font-medium text-green-600">
                              {data.recovered} ({data.sent > 0 ? ((data.recovered / data.sent) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>

                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${data.sent > 0 ? (data.recovered / data.sent) * 100 : 0}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Hourly Distribution
                    </CardTitle>
                    <CardDescription>
                      When customers are most likely to recover their carts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                      {stats.hourlyStats.map((hour) => (
                        <div key={hour.hour} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{hour.hour}:00</div>
                          <div 
                            className="h-16 bg-blue-500 rounded-t"
                            style={{ 
                              opacity: Math.max(0.2, hour.recovered / Math.max(...stats.hourlyStats.map(h => h.recovered))),
                              minHeight: '4px'
                            }}
                          />
                          <div className="text-xs font-medium">{hour.recovered}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SimpleTabsContent>

            <SimpleTabsContent value="discounts">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recovery with Discount</CardTitle>
                      <CardDescription>
                        Carts recovered using discount incentives
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Count</span>
                          <span className="text-2xl font-bold">{stats.discountStats?.withDiscount?.count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Revenue</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.discountStats?.withDiscount?.revenue || 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recovery without Discount</CardTitle>
                      <CardDescription>
                        Carts recovered without discount incentives
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Count</span>
                          <span className="text-2xl font-bold">{stats.discountStats?.withoutDiscount?.count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Revenue</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.discountStats?.withoutDiscount?.revenue || 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Discount Impact Analysis</CardTitle>
                    <CardDescription>
                      Comparison of recovery performance with and without discounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.discountStats ? (
                        <DiscountImpactBars stats={stats.discountStats} />
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          No discount statistics available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SimpleTabsContent>
          </SimpleTabs>
        </>
      )}
    </div>
  );
}
