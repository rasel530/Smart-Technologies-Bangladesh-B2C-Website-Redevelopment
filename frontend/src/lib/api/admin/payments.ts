/**
 * Admin Payment API Client
 * Phase 7 Milestone 4: Connect Admin Payment Pages to Real Backend APIs
 * Handles all admin payment management API calls
 */

import { apiClient } from '../client';

/**
 * Payment filters interface
 */
export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Payment transaction interface
 */
export interface PaymentTransaction {
  id: string;
  transactionId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  gateway: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dashboard summary interface
 */
export interface DashboardSummary {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
  recentTransactions: PaymentTransaction[];
}

/**
 * Payments response interface
 */
export interface PaymentsResponse {
  payments: PaymentTransaction[];
  summary: DashboardSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Payment detail interface
 */
export interface PaymentDetail {
  id: string;
  transactionId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  gateway: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields for detail view
  metadata?: Record<string, any>;
  gatewayResponse?: Record<string, any>;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}

/**
 * Refund request interface
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

/**
 * Refund result interface
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundAmount: number;
  message: string;
}

/**
 * Payment log interface
 */
export interface PaymentLog {
  id: string;
  paymentId: string;
  action: string;
  status: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
}

/**
 * Get all payments with filters
 * @param filters - Payment filters
 * @returns Promise<PaymentsResponse> The payments list with summary and pagination
 */
export const getPayments = async (filters: PaymentFilters = {}): Promise<PaymentsResponse> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/admin/payments?${queryString}` : '/api/v1/admin/payments';
    
    const response = await apiClient.get<PaymentsResponse>(url);
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error getting payments:', error);
    
    // Enhanced error handling with user-friendly messages
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load payments. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get payment by ID
 * @param id - The payment ID
 * @returns Promise<PaymentDetail> The payment details
 */
export const getPaymentById = async (id: string): Promise<PaymentDetail> => {
  try {
    const response = await apiClient.get<PaymentDetail>(`/api/v1/admin/payments/${id}`);
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error getting payment:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load payment details. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Update payment status
 * @param id - The payment ID
 * @param status - The new status
 * @returns Promise<PaymentTransaction> The updated payment
 */
export const updatePaymentStatus = async (
  id: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
): Promise<PaymentTransaction> => {
  try {
    const response = await apiClient.put<PaymentTransaction>(
      `/api/v1/admin/payments/${id}/status`,
      { status }
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error updating payment status:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to update payment status. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Process refund
 * @param paymentId - The payment ID
 * @param amount - Optional refund amount (defaults to full amount)
 * @param reason - Optional refund reason
 * @returns Promise<RefundResult> The refund result
 */
export const processRefund = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> => {
  try {
    const requestBody: RefundRequest = {
      paymentId,
      amount,
      reason
    };
    
    const response = await apiClient.post<RefundResult>(
      `/api/v1/admin/payments/${paymentId}/refund`,
      requestBody
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error processing refund:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to process refund. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get payment logs
 * @param paymentId - The payment ID
 * @returns Promise<PaymentLog[]> The payment logs
 */
export const getPaymentLogs = async (paymentId: string): Promise<PaymentLog[]> => {
  try {
    const response = await apiClient.get<PaymentLog[]>(
      `/api/v1/admin/payments/${paymentId}/logs`
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error getting payment logs:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load payment logs. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get all payment logs (admin)
 * @param filters - Optional filters
 * @returns Promise<PaymentLog[]> The payment logs
 */
export const getAllPaymentLogs = async (filters?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaymentLog[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/admin/payments/logs?${queryString}` : '/api/v1/admin/payments/logs';
    
    const response = await apiClient.get<PaymentLog[]>(url);
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error getting payment logs:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load payment logs. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Export payments to CSV
 * @param filters - Optional filter parameters for export
 * @returns Promise<Blob> CSV file as blob
 */
export const exportPayments = async (
  filters?: PaymentFilters
): Promise<Blob> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/admin/payments/export?${queryString}` : '/api/v1/admin/payments/export';
    
    // Use fetch directly to get blob response
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to export payments');
    }

    return await response.blob();
  } catch (error: any) {
    console.error('[Admin Payment API] Error exporting payments:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to export payments. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get payment analytics (admin)
 * @param params - Optional date range parameters
 * @returns Promise<DashboardSummary> The payment analytics data
 */
export const getPaymentAnalytics = async (
  params?: { startDate?: string; endDate?: string }
): Promise<DashboardSummary> => {
  try {
    let url = '/api/v1/admin/payments/analytics';
    if (params && (params.startDate || params.endDate)) {
      const queryParams = new URLSearchParams();
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      url = `/api/v1/admin/payments/analytics?${queryParams.toString()}`;
    }
    
    const response = await apiClient.get<DashboardSummary>(url);
    return response;
  } catch (error: any) {
    console.error('[Admin Payment API] Error getting payment analytics:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load payment analytics. Please try again.';
    
    throw new Error(errorMessage);
  }
};

// Export all admin payment API functions
export default {
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  processRefund,
  getPaymentLogs,
  getAllPaymentLogs,
  exportPayments,
  getPaymentAnalytics,
};
