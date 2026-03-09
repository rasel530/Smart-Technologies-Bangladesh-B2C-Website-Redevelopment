/**
 * Admin Payment Hooks
 *
 * This file contains custom React hooks for managing payment-related data and operations
 * in the admin panel. These hooks provide state management, data fetching, and
 * action handlers for payment transactions, refunds, analytics, and logs.
 */

import { useState, useEffect, useCallback } from 'react';
import { adminPaymentApi } from '../services/adminPaymentApi';
import type {
  PaymentTransaction,
  PaymentQueryParams,
  PaymentTransactionsResponse,
  RefundRequest,
  RefundResponse,
  GatewaySettings,
  GatewaySettingsResponse,
  AnalyticsQueryParams,
  PaymentAnalytics,
  LogQueryParams,
  PaymentLog,
  PaymentLogsResponse,
  TransactionTimeline,
  SecurityEvent
} from '@/types/payment';

/**
 * Hook for managing payment transactions list
 */
export const useAdminPayments = (params: PaymentQueryParams) => {
  const [data, setData] = useState<PaymentTransactionsResponse | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminPaymentApi.getAllPayments(params);
      setData(response);
      setPayments(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    data,
    payments,
    isLoading,
    error,
    refetch: fetchPayments
  };
};

/**
 * Hook for managing a single payment transaction
 */
export const usePayment = (id: string) => {
  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminPaymentApi.getPaymentById(id);
      setPayment(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment';
      setError(errorMessage);
      console.error('Error fetching payment:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  return {
    payment,
    isLoading,
    error,
    refetch: fetchPayment
  };
};

/**
 * Hook for managing payment refunds
 */
export const usePaymentRefund = () => {
  const [isRefunding, setIsRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const processRefund = useCallback(async (id: string, data: RefundRequest): Promise<RefundResponse | null> => {
    try {
      setIsRefunding(true);
      setError(null);
      setSuccess(false);
      
      const response = await adminPaymentApi.processRefund(id, data);
      setSuccess(true);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMessage);
      console.error('Error processing refund:', err);
      return null;
    } finally {
      setIsRefunding(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isRefunding,
    error,
    success,
    processRefund,
    reset
  };
};

/**
 * Hook for managing payment analytics
 */
export const usePaymentAnalytics = (params: AnalyticsQueryParams) => {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminPaymentApi.getPaymentAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
};

/**
 * Hook for managing gateway settings
 */
export const useGatewaySettings = () => {
  const [settings, setSettings] = useState<GatewaySettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminPaymentApi.getGatewaySettings();
      setSettings(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gateway settings';
      setError(errorMessage);
      console.error('Error fetching gateway settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (gateway: string, data: Partial<GatewaySettings>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedSettings = await adminPaymentApi.updateGatewaySettings(gateway, data);
      
      setSettings(prev => 
        prev.map(setting => 
          setting.gateway === gateway ? updatedSettings : setting
        )
      );
      
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update gateway settings';
      setError(errorMessage);
      console.error('Error updating gateway settings:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const testConnection = useCallback(async (gateway: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await adminPaymentApi.testGatewayConnection(gateway);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
      console.error('Error testing gateway connection:', err);
      return { success: false, message: errorMessage };
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    refetch: fetchSettings,
    updateSettings,
    testConnection
  };
};

/**
 * Hook for managing payment logs
 */
export const usePaymentLogs = (params: LogQueryParams) => {
  const [data, setData] = useState<PaymentLogsResponse | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminPaymentApi.getPaymentLogs(params);
      setData(response);
      setLogs(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    data,
    logs,
    isLoading,
    error,
    refetch: fetchLogs
  };
};

/**
 * Hook for managing transaction timeline
 */
export const useTransactionTimeline = (paymentId: string) => {
  const [timeline, setTimeline] = useState<TransactionTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!paymentId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminPaymentApi.getTransactionTimeline(paymentId);
      setTimeline(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timeline';
      setError(errorMessage);
      console.error('Error fetching timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    timeline,
    isLoading,
    error,
    refetch: fetchTimeline
  };
};

/**
 * Hook for managing security events
 */
export const useSecurityEvents = (paymentId: string) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!paymentId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminPaymentApi.getSecurityEvents(paymentId);
      setEvents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch security events';
      setError(errorMessage);
      console.error('Error fetching security events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents
  };
};

/**
 * Hook for managing dashboard summary
 */
export const useDashboardSummary = () => {
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    totalTransactions: number;
    successRate: number;
    pendingPayments: number;
    failedPayments: number;
    refundedAmount: number;
    recentTransactions: PaymentTransaction[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminPaymentApi.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard summary';
      setError(errorMessage);
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary
  };
};

/**
 * Hook for exporting payment data
 */
export const usePaymentExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = useCallback(async (params: PaymentQueryParams): Promise<Blob | null> => {
    try {
      setIsExporting(true);
      setError(null);
      const blob = await adminPaymentApi.exportPaymentsToCSV(params);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to CSV';
      setError(errorMessage);
      console.error('Error exporting to CSV:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportToExcel = useCallback(async (params: PaymentQueryParams): Promise<Blob | null> => {
    try {
      setIsExporting(true);
      setError(null);
      const blob = await adminPaymentApi.exportPaymentsToExcel(params);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to Excel';
      setError(errorMessage);
      console.error('Error exporting to Excel:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, []);

  return {
    isExporting,
    error,
    exportToCSV,
    exportToExcel,
    downloadFile
  };
};

/**
 * Hook for exporting log data
 */
export const useLogExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = useCallback(async (params: LogQueryParams): Promise<Blob | null> => {
    try {
      setIsExporting(true);
      setError(null);
      const blob = await adminPaymentApi.exportLogsToCSV(params);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export logs to CSV';
      setError(errorMessage);
      console.error('Error exporting logs to CSV:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, []);

  return {
    isExporting,
    error,
    exportToCSV,
    downloadFile
  };
};

export default {
  useAdminPayments,
  usePayment,
  usePaymentRefund,
  usePaymentAnalytics,
  useGatewaySettings,
  usePaymentLogs,
  useTransactionTimeline,
  useSecurityEvents,
  useDashboardSummary,
  usePaymentExport,
  useLogExport
};
