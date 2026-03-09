/**
 * Admin Payment API Service
 *
 * This service handles all API calls related to payment management in the admin panel.
 * It provides methods for managing payments, refunds, gateway settings, analytics, and logs.
 */

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
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Create headers with authentication
 */
const createHeaders = (contentType: boolean = true): HeadersInit => {
  const headers: HeadersInit = {};
  const token = getAuthToken();
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

/**
 * Handle API errors
 */
const handleApiError = async (response: Response): Promise<never> => {
  const errorData = await response.json().catch(() => ({
    message: response.statusText || 'An error occurred'
  }));
  
  throw new Error(errorData.message || `API Error: ${response.status}`);
};

/**
 * Admin Payment API
 */
export const adminPaymentApi = {
  /**
   * Get all payments with filtering and pagination
   */
  getAllPayments: async (params: PaymentQueryParams): Promise<PaymentTransactionsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await fetch(`/api/v1/admin/payments?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.json();
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (id: string): Promise<PaymentTransaction> => {
    const response = await fetch(`/api/v1/admin/payments/${id}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Get payment by order ID
   */
  getPaymentByOrderId: async (orderId: string): Promise<PaymentTransaction> => {
    const response = await fetch(`/api/v1/admin/payments/order/${orderId}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Process refund
   */
  processRefund: async (id: string, data: RefundRequest): Promise<RefundResponse> => {
    const response = await fetch(`/api/v1/admin/payments/${id}/refund`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.json();
  },

  /**
   * Get transaction timeline
   */
  getTransactionTimeline: async (id: string): Promise<TransactionTimeline[]> => {
    const response = await fetch(`/api/v1/admin/payments/${id}/timeline`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Get security events for a transaction
   */
  getSecurityEvents: async (id: string): Promise<SecurityEvent[]> => {
    const response = await fetch(`/api/v1/admin/payments/${id}/security-events`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Get payment analytics
   */
  getPaymentAnalytics: async (params: AnalyticsQueryParams): Promise<PaymentAnalytics> => {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.gateway) queryParams.append('gateway', params.gateway);
    
    const response = await fetch(`/api/v1/admin/payments/analytics?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Get gateway settings
   */
  getGatewaySettings: async (): Promise<GatewaySettingsResponse> => {
    const response = await fetch('/api/v1/admin/gateways', {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.json();
  },

  /**
   * Get gateway settings by gateway type
   */
  getGatewaySettingsByType: async (gateway: string): Promise<GatewaySettings> => {
    const response = await fetch(`/api/v1/admin/gateways/${gateway}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Update gateway settings
   */
  updateGatewaySettings: async (gateway: string, data: Partial<GatewaySettings>): Promise<GatewaySettings> => {
    const response = await fetch(`/api/v1/admin/gateways/${gateway}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const responseData = await response.json();
    return responseData.data;
  },

  /**
   * Test gateway connection
   */
  testGatewayConnection: async (gateway: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/v1/admin/gateways/${gateway}/test`, {
      method: 'POST',
      headers: createHeaders()
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.json();
  },

  /**
   * Get payment logs
   */
  getPaymentLogs: async (params: LogQueryParams): Promise<PaymentLogsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.transactionId) queryParams.append('transactionId', params.transactionId);
    if (params.orderId) queryParams.append('orderId', params.orderId);
    if (params.eventType) queryParams.append('eventType', params.eventType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`/api/v1/admin/payments/logs?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.json();
  },

  /**
   * Get log details by ID
   */
  getLogDetails: async (logId: string): Promise<PaymentLog> => {
    const response = await fetch(`/api/v1/admin/payments/logs/${logId}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  },

  /**
   * Export payments to CSV
   */
  exportPaymentsToCSV: async (params: PaymentQueryParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetch(`/api/v1/admin/payments/export/csv?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.blob();
  },

  /**
   * Export payments to Excel
   */
  exportPaymentsToExcel: async (params: PaymentQueryParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetch(`/api/v1/admin/payments/export/excel?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.blob();
  },

  /**
   * Export logs to CSV
   */
  exportLogsToCSV: async (params: LogQueryParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params.transactionId) queryParams.append('transactionId', params.transactionId);
    if (params.orderId) queryParams.append('orderId', params.orderId);
    if (params.eventType) queryParams.append('eventType', params.eventType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`/api/v1/admin/payments/logs/export/csv?${queryParams.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return await response.blob();
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async (): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    successRate: number;
    pendingPayments: number;
    failedPayments: number;
    refundedAmount: number;
    recentTransactions: PaymentTransaction[];
  }> => {
    const response = await fetch('/api/v1/admin/payments/dashboard/summary', {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    const data = await response.json();
    return data.data;
  }
};

export default adminPaymentApi;
