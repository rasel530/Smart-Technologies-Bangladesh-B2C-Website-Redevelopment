'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import { 
  ArrowLeft, 
  BarChart3, 
  Settings, 
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Types
interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageOrderValue: number;
  revenueGrowth: number;
  transactionGrowth: number;
  paymentMethodDistribution: PaymentMethodStats[];
  dailyRevenue: DailyRevenue[];
  gatewayPerformance: GatewayStats[];
}

interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

interface GatewayStats {
  gateway: string;
  totalTransactions: number;
  successRate: number;
  averageResponseTime: number;
  totalAmount: number;
}

interface DateRange {
  startDate?: string;
  endDate?: string;
}

type SortField = 'date' | 'revenue' | 'transactions' | 'successRate' | 'gateway' | 'totalTransactions' | 'totalAmount' | 'averageResponseTime';
type SortOrder = 'asc' | 'desc';

// Utility functions
const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || !isFinite(amount)) return 'N/A';
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// API client functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const fetchAnalytics = async (dateRange?: DateRange): Promise<PaymentAnalytics> => {
  try {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

const fetchDailyAnalytics = async (startDate?: string, endDate?: string): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/daily?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch daily analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    throw error;
  }
};

const fetchMonthlyAnalytics = async (year?: number, month?: number): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/monthly?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch monthly analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    throw error;
  }
};

const fetchGatewayAnalytics = async (gateway: string, startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    params.append('gateway', gateway);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/gateway?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch gateway analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching gateway analytics:', error);
    throw error;
  }
};

const fetchMethodAnalytics = async (method: string, startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    params.append('method', method);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/method?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch method analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching method analytics:', error);
    throw error;
  }
};

const fetchConversionRate = async (startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/conversion?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversion rate');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching conversion rate:', error);
    throw error;
  }
};

const fetchFailureAnalysis = async (startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/failures?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch failure analysis');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching failure analysis:', error);
    throw error;
  }
};

const fetchRevenueTracking = async (startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/revenue?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch revenue tracking');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching revenue tracking:', error);
    throw error;
  }
};

const fetchPerformanceMetrics = async (startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/admin/payments/analytics/performance?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch performance metrics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

// Main component
function PaymentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date range filter
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Sorting functionality
  const [dailyRevenueSort, setDailyRevenueSort] = useState<{ field: SortField; order: SortOrder }>({ field: 'date', order: 'desc' });
  const [gatewaySort, setGatewaySort] = useState<{ field: SortField; order: SortOrder }>({ field: 'totalTransactions', order: 'desc' });
  
  // Pagination functionality
  const [dailyRevenuePage, setDailyRevenuePage] = useState(1);
  const [gatewayPage, setGatewayPage] = useState(1);
  const [paymentMethodPage, setPaymentMethodPage] = useState(1);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const itemsPerPage = 10;
  
  // Fetch analytics data
  const fetchAnalyticsData = async (dateRange?: DateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch analytics from backend
      const analyticsData = await fetchAnalytics(dateRange);
      
      // Process analytics data
      const processedAnalytics: PaymentAnalytics = {
        totalRevenue: analyticsData.totalRevenue || 0,
        totalTransactions: analyticsData.totalTransactions || 0,
        successRate: analyticsData.successRate || 0,
        averageOrderValue: analyticsData.averageOrderValue || 0,
        revenueGrowth: analyticsData.revenueGrowth || 0,
        transactionGrowth: analyticsData.transactionGrowth || 0,
        paymentMethodDistribution: analyticsData.paymentMethodDistribution || [],
        dailyRevenue: analyticsData.dailyRevenue || [],
        gatewayPerformance: analyticsData.gatewayPerformance || []
      };
      
      setAnalytics(processedAnalytics);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Debounced date range change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dateRange.startDate && dateRange.endDate) {
        fetchAnalyticsData();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [dateRange]);
  
  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  
  // Search functionality with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      // Search is handled in filtered data computation
    }, 500);
    
    setSearchDebounceTimer(timer);
  };
  
  // Sorting handlers
  const handleSort = (table: 'dailyRevenue' | 'gateway', field: SortField) => {
    if (table === 'dailyRevenue') {
      setDailyRevenueSort(prev => ({
        field,
        order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setGatewaySort(prev => ({
        field,
        order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
      }));
    }
  };
  
  // Filter and sort data
  const filteredPaymentMethods = useMemo(() => {
    let filtered = analytics?.paymentMethodDistribution || [];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pm => 
        pm.method.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [analytics, searchQuery]);
  
  const filteredDailyRevenue = useMemo(() => {
    let filtered = analytics?.dailyRevenue || [];
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const { field, order } = dailyRevenueSort;
      let comparison = 0;
      
      switch (field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'transactions':
          comparison = a.transactions - b.transactions;
          break;
        default:
          comparison = 0;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [analytics, dailyRevenueSort]);
  
  const filteredGateways = useMemo(() => {
    let filtered = analytics?.gatewayPerformance || [];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gw => 
        gw.gateway.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const { field, order } = gatewaySort;
      let comparison = 0;
      
      switch (field) {
        case 'gateway':
          comparison = a.gateway.localeCompare(b.gateway);
          break;
        case 'totalTransactions':
          comparison = a.totalTransactions - b.totalTransactions;
          break;
        case 'successRate':
          comparison = a.successRate - b.successRate;
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'averageResponseTime':
          comparison = a.averageResponseTime - b.averageResponseTime;
          break;
        default:
          comparison = 0;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [analytics, searchQuery, gatewaySort]);
  
  // Pagination
  const paginatedDailyRevenue = useMemo(() => {
    const startIndex = (dailyRevenuePage - 1) * itemsPerPage;
    return filteredDailyRevenue.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDailyRevenue, dailyRevenuePage]);
  
  const paginatedGateways = useMemo(() => {
    const startIndex = (gatewayPage - 1) * itemsPerPage;
    return filteredGateways.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGateways, gatewayPage]);
  
  const paginatedPaymentMethods = useMemo(() => {
    const startIndex = (paymentMethodPage - 1) * itemsPerPage;
    return filteredPaymentMethods.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPaymentMethods, paymentMethodPage]);
  
  // Date range presets
  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Custom Range', value: 'custom' }
  ];
  
  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    switch (preset) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };
  
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setSelectedPreset('custom');
    setDateRange(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };
  
  const handleClearFilters = () => {
    setDateRange({});
    setSelectedPreset('');
    setSearchQuery('');
    setDateRangeError(null);
    setDailyRevenueSort({ field: 'date', order: 'desc' });
    setGatewaySort({ field: 'totalTransactions', order: 'desc' });
    setDailyRevenuePage(1);
    setGatewayPage(1);
    setPaymentMethodPage(1);
  };
  
  // Refresh functionality
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };
  
  // Export functions
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
  };
  
  const exportPaymentMethods = () => {
    if (!analytics || filteredPaymentMethods.length === 0) {
      alert('No payment method data to export');
      return;
    }
    
    const headers = ['Payment Method', 'Count', 'Amount', 'Percentage'];
    const rows = filteredPaymentMethods.map(pm => [
      pm.method,
      pm.count.toString(),
      formatCurrency(pm.amount),
      `${pm.percentage.toFixed(2)}%`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `payment-methods-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportDailyRevenue = () => {
    if (!analytics || filteredDailyRevenue.length === 0) {
      alert('No daily revenue data to export');
      return;
    }
    
    const headers = ['Date', 'Revenue', 'Transactions', 'Average Value'];
    const rows = filteredDailyRevenue.map(day => [
      day.date,
      day.revenue.toString(),
      day.transactions.toString(),
      day.transactions > 0 ? (day.revenue / day.transactions).toFixed(2) : 'N/A'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `daily-revenue-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportGatewayPerformance = () => {
    if (!analytics || filteredGateways.length === 0) {
      alert('No gateway performance data to export');
      return;
    }
    
    const headers = ['Gateway', 'Total Transactions', 'Success Rate', 'Average Response Time', 'Total Amount'];
    const rows = filteredGateways.map(gw => [
      gw.gateway,
      gw.totalTransactions.toString(),
      `${gw.successRate.toFixed(2)}%`,
      gw.averageResponseTime > 0 ? `${gw.averageResponseTime}s` : 'N/A',
      formatCurrency(gw.totalAmount)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `gateway-performance-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const exportSummary = () => {
    if (!analytics) {
      alert('No data to export');
      return;
    }
    
    const headers = ['Date Range', 'Total Revenue', 'Total Transactions', 'Success Rate', 'Average Order Value'];
    const rows = [
      dateRange.startDate && dateRange.endDate 
        ? `${dateRange.startDate} to ${dateRange.endDate}`
        : 'All Time',
      formatCurrency(analytics.totalRevenue),
      analytics.totalTransactions.toString(),
      `${analytics.successRate.toFixed(2)}%`,
      formatCurrency(analytics.averageOrderValue)
    ];
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `payment-analytics-summary-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  // Render sort icon
  const renderSortIcon = (field: SortField, currentSort: { field: SortField; order: SortOrder }) => {
    if (currentSort.field !== field) return null;
    return currentSort.order === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />;
  };
  
  // Render pagination controls
  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of {totalPages * itemsPerPage} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <AdminLayout title="Payment Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive payment analytics and insights
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </Link>
            <Link
              href="/admin/payments/gateways"
              className="inline-flex items-center gap-2 px-4 py-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Gateway Settings
            </Link>
            <Link
              href="/admin/payments/logs"
              className="inline-flex items-center gap-2 px-4 py-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Logs
            </Link>
          </div>
        </div>
        
        {/* Page Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            View comprehensive payment analytics including transaction volumes, success rates,
            revenue trends, payment method distribution, and fraud detection statistics.
          </p>
        </div>
        
        {/* Refresh button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
            <RefreshCw className="w-4 h-4" />
            Refresh
            {refreshing && <span className="ml-2">Refreshing...</span>}
          </button>
        </div>
        
        {/* Success Message */}
        {refreshing && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-green-700">Analytics refreshed successfully</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => fetchAnalyticsData()}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(analytics.totalRevenue)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.revenueGrowth >= 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">+{analytics.revenueGrowth}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">{analytics.revenueGrowth}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              {/* Total Transactions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.totalTransactions.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.transactionGrowth >= 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">+{analytics.transactionGrowth}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">{analytics.transactionGrowth}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              {/* Success Rate */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.successRate.toFixed(2)}%
                    </p>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mt-2">Payment success rate</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
              
              {/* Average Order Value */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(analytics.averageOrderValue)}
                    </p>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mt-2">Per transaction</p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Method Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment Method Distribution</h2>
                <button
                  onClick={exportPaymentMethods}
                  disabled={loading || filteredPaymentMethods.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="space-y-4">
                {paginatedPaymentMethods.map((method) => (
                  <div key={method.method}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {method.method}
                      </span>
                      <span className="text-xs text-gray-600">
                        {method.count} transactions ({method.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredPaymentMethods.length > itemsPerPage && renderPagination(paymentMethodPage, Math.ceil(filteredPaymentMethods.length / itemsPerPage), setPaymentMethodPage)}
            </div>
            
            {/* Daily Revenue Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Daily Revenue Trend</h2>
                <button
                  onClick={exportDailyRevenue}
                  disabled={loading || filteredDailyRevenue.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('dailyRevenue', 'date')}
                        >
                        Date {renderSortIcon('date', dailyRevenueSort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('dailyRevenue', 'revenue')}
                        >
                        Revenue {renderSortIcon('revenue', dailyRevenueSort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('dailyRevenue', 'transactions')}
                        >
                        Transactions {renderSortIcon('transactions', dailyRevenueSort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                        Avg Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedDailyRevenue.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(day.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {day.transactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {day.transactions > 0 ? formatCurrency(day.revenue / day.transactions) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination(dailyRevenuePage, Math.ceil(filteredDailyRevenue.length / itemsPerPage), setDailyRevenuePage)}
              </div>
            </div>
            
            {/* Gateway Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Gateway Performance</h2>
                <button
                  onClick={exportGatewayPerformance}
                  disabled={loading || filteredGateways.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('gateway', 'gateway')}
                        >
                        Gateway {renderSortIcon('gateway', gatewaySort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('gateway', 'totalTransactions')}
                        >
                        Transactions {renderSortIcon('totalTransactions', gatewaySort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('gateway', 'successRate')}
                        >
                        Success Rate {renderSortIcon('successRate', gatewaySort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('gateway', 'averageResponseTime')}
                        >
                        Avg Response Time {renderSortIcon('averageResponseTime', gatewaySort)}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('gateway', 'totalAmount')}
                        >
                        Total Amount {renderSortIcon('totalAmount', gatewaySort)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedGateways.map((gateway) => (
                      <tr key={gateway.gateway} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {gateway.gateway}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {gateway.totalTransactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            gateway.successRate >= 95
                              ? 'bg-green-100 text-green-800'
                              : gateway.successRate >= 90
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {gateway.successRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {gateway.averageResponseTime > 0 ? `${gateway.averageResponseTime}s` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(gateway.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination(gatewayPage, Math.ceil(filteredGateways.length / itemsPerPage), setGatewayPage)}
              </div>
            </div>
            
            {/* Export Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Export Summary Report</h2>
                <p className="text-gray-600 mb-4">
                  Download a comprehensive summary report including all key metrics and aggregated data.
                </p>
                <button
                  onClick={exportSummary}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                  <Download className="w-4 h-4" />
                  Export Summary Report
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
    );
}

export default withAuth(PaymentAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
