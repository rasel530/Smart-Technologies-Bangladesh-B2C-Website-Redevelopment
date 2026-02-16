/**
 * Admin Cart API Client
 *
 * This file provides methods for interacting with the admin cart API endpoints.
 * It follows the existing API client pattern and requires appropriate permissions.
 */

import { apiClient } from '../client';

/**
 * Cart filters interface
 */
export interface CartFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'abandoned' | 'converted' | 'expired';
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Cart list response interface
 */
export interface CartListResponse {
  carts: AdminCart[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Admin cart interface
 */
export interface AdminCart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: AdminCartItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: 'active' | 'abandoned' | 'converted' | 'expired';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    items: number;
  };
  // Discount-related fields (optional for admin carts)
  discountBreakdown?: {
    couponCode?: string;
    percentage?: number;
    fixedAmount?: number;
    appliedAmount: number;
  };
  totalDiscount?: number;
  itemCount?: number;
  totalItems?: number;
}

/**
 * Admin cart item interface
 */
export interface AdminCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: Date;
  variantId?: string | null;
  product?: {
    id: string;
    name: string;
    nameEn?: string;
    nameBn?: string;
    sku: string;
    images?: Array<{
      id: string;
      url: string;
      altTextEn?: string;
      altTextBn?: string;
    }>;
  };
  variant?: {
    id: string;
    name: string;
    stock: number;
  };
}

/**
 * Cart analytics interface
 */
export interface CartAnalytics {
  totalCarts: number;
  activeCarts: number;
  expiredCarts: number;
  abandonedCarts: number;
  conversionRate: number;
  averageCartValue: number;
  averageItemsPerCart: number;
  topAbandonedProducts: Array<{
    productId: string;
    productName: string;
    abandonmentCount: number;
  }>;
  cartSizeDistribution: Array<{
    itemCount: number;
    cartCount: number;
  }>;
  timeInCartDistribution: Array<{
    timeRange: string;
    cartCount: number;
  }>;
}

/**
 * Update cart item request interface
 */
export interface UpdateCartItemRequest {
  quantity?: number;
  price?: number;
}

/**
 * Cleanup expired carts response interface
 */
export interface CleanupExpiredCartsResponse {
  deletedCount: number;
  expiredCarts: string[];
}

/**
 * Bulk delete carts request interface
 */
export interface BulkDeleteCartsRequest {
  cartIds: string[];
}

/**
 * Bulk clear carts request interface
 */
export interface BulkClearCartsRequest {
  cartIds: string[];
}

/**
 * Bulk update cart status request interface
 */
export interface BulkUpdateCartStatusRequest {
  cartIds: string[];
  status: 'active' | 'abandoned' | 'converted' | 'expired';
}

/**
 * Bulk operation response interface
 */
export interface BulkOperationResponse {
  deletedCount?: number;
  clearedCount?: number;
  updatedCount?: number;
  deletedCartIds?: string[];
  clearedCartIds?: string[];
  updatedCartIds?: string[];
  status?: string;
}

/**
 * Cleanup response interface
 */
export interface CleanupResponse {
  success: boolean;
  cleaned: number;
  released?: number;
  errors: Array<{ cartId?: string; error: string }>;
  message: string;
  duration: number;
  dryRun?: boolean;
}

/**
 * Abandoned cleanup response interface
 */
export interface AbandonedCleanupResponse {
  success: boolean;
  cleaned: number;
  remindersSent: number;
  errors: Array<{ cartId?: string; error: string }>;
  message: string;
  duration: number;
  dryRun?: boolean;
}

/**
 * Full cleanup response interface
 */
export interface FullCleanupResponse {
  success: boolean;
  cartsExpired: number;
  reservationsReleased: number;
  abandonedCleaned: number;
  remindersSent: number;
  errors: Array<{ phase?: string; error: string }>;
  duration: number;
}

/**
 * Reminder response interface
 */
export interface ReminderResponse {
  success: boolean;
  sent: number;
  errors: Array<{ cartId?: string; email?: string; error: string }>;
  message: string;
  duration: number;
}

/**
 * Cleanup stats response interface
 */
export interface CleanupStatsResponse {
  success: boolean;
  data: {
    cleanupStats: {
      totalCartsExpired: number;
      totalReservationsReleased: number;
      totalAbandonedCleaned: number;
      totalRemindersSent: number;
      byType: Record<string, number>;
      recentOperations: Array<{
        id: string;
        type: string;
        cartId: string;
        timestamp: string;
        details: Record<string, unknown>;
      }>;
    };
    currentCartCounts: {
      active: number;
      abandoned: number;
      expired: number;
      converted: number;
      total: number;
    };
    dateRange: {
      startDate?: string;
      endDate?: string;
    };
  };
}

/**
 * Cleanup history response interface
 */
export interface CleanupHistoryResponse {
  success: boolean;
  data: {
    history: Array<{
      id: string;
      type: string;
      cartId: string;
      userId?: string;
      sessionId?: string;
      details: Record<string, unknown>;
      timestamp: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * Scheduler response interface
 */
export interface SchedulerResponse {
  success: boolean;
  message: string;
  status: {
    isRunning: boolean;
    nextRuns: Record<string, { cronExpression: string; description: string; nextRun: string }>;
    startedAt?: string;
  };
}

/**
 * Scheduler status response interface
 */
export interface SchedulerStatusResponse {
  success: boolean;
  data: {
    scheduler: {
      isRunning: boolean;
      startedAt?: string;
      nextRuns: Record<string, { cronExpression: string; description: string; nextRun: string }>;
    };
    jobs: Array<{
      name: string;
      cronExpression: string;
      description: string;
      nextRun: string;
      isRunning: boolean;
    }>;
    cleanupStats: {
      cartsExpired: number;
      reservationsReleased: number;
      abandonedCleaned: number;
      remindersSent: number;
      lastRun?: string;
      config: {
        cartTTL: number;
        reservationTTL: number;
        abandonedCartThreshold: number;
        recoveryReminderThreshold: number;
        batchSize: number;
      };
    };
  };
}

/**
 * Run job response interface
 */
export interface RunJobResponse {
  success: boolean;
  message: string;
  duration: number;
  jobName: string;
  cronExpression: string;
  error?: string;
}

/**
 * Get carts list with filters
 * @param params - Filter and pagination parameters
 * @returns Promise<CartListResponse> The carts list with pagination
 */
export const getCarts = async (params: CartFilters = {}): Promise<CartListResponse> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const url = queryString ? `/admin/carts?${queryString}` : '/admin/carts';
    
    const response = await apiClient.get<CartListResponse>(url);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting carts:', error);
    throw error;
  }
};

/**
 * Get cart details by ID
 * @param id - The cart ID
 * @returns Promise<AdminCart> The cart details
 */
export const getCart = async (id: string): Promise<AdminCart> => {
  try {
    const response = await apiClient.get<AdminCart>(`/admin/carts/${id}`);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting cart:', error);
    throw error;
  }
};

/**
 * Get cart items
 * @param cartId - The cart ID
 * @returns Promise<AdminCartItem[]> The cart items
 */
export const getCartItems = async (cartId: string): Promise<AdminCartItem[]> => {
  try {
    const response = await apiClient.get<AdminCartItem[]>(`/admin/carts/${cartId}/items`);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting cart items:', error);
    throw error;
  }
};

/**
 * Update cart item (admin override)
 * @param cartId - The cart ID
 * @param itemId - The cart item ID
 * @param data - The update data
 * @returns Promise<AdminCartItem> The updated cart item
 */
export const updateCartItem = async (
  cartId: string,
  itemId: string,
  data: UpdateCartItemRequest
): Promise<AdminCartItem> => {
  try {
    const response = await apiClient.put<AdminCartItem>(
      `/admin/carts/${cartId}/items/${itemId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error updating cart item:', error);
    throw error;
  }
};

/**
 * Remove cart item (admin override)
 * @param cartId - The cart ID
 * @param itemId - The cart item ID
 * @returns Promise<{ success: boolean }> Success response
 */
export const removeCartItem = async (
  cartId: string,
  itemId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(
      `/admin/carts/${cartId}/items/${itemId}`
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error removing cart item:', error);
    throw error;
  }
};

/**
 * Clear cart (admin override)
 * @param cartId - The cart ID
 * @returns Promise<{ success: boolean }> Success response
 */
export const clearCart = async (cartId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/admin/carts/${cartId}`);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error clearing cart:', error);
    throw error;
  }
};

/**
 * Get cart analytics
 * @param params - Optional date range parameters
 * @returns Promise<CartAnalytics> The cart analytics data
 */
export const getCartAnalytics = async (
  params?: { startDate?: string; endDate?: string }
): Promise<CartAnalytics> => {
  try {
    // Build query string from params
    // Fixed: Changed path from '/admin/cart-analytics' to '/admin/carts/analytics' to match backend endpoint
    let url = '/admin/carts/analytics';
    if (params && (params.startDate || params.endDate)) {
      const queryParams = new URLSearchParams();
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      url = `/admin/carts/analytics?${queryParams.toString()}`;
    }
    
    const response = await apiClient.get<CartAnalytics>(url);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting cart analytics:', error);
    throw error;
  }
};

/**
 * Clean up expired carts
 * @returns Promise<CleanupExpiredCartsResponse> Cleanup response
 */
export const cleanupExpiredCarts = async (): Promise<CleanupExpiredCartsResponse> => {
  try {
    const response = await apiClient.delete<CleanupExpiredCartsResponse>(
      '/admin/carts/expired'
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error cleaning up expired carts:', error);
    throw error;
  }
};

/**
 * Export carts to CSV (AP-HIGH-001: Export functionality)
 * @param params - Optional filter parameters for export
 * @returns Promise<Blob> CSV file as blob
 */
export const exportCarts = async (
  params?: CartFilters
): Promise<Blob> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const url = queryString ? `/admin/carts/export?${queryString}` : '/admin/carts/export';
    
    // Use fetch directly to get blob response
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to export carts: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('[Admin Cart API] Error exporting carts:', error);
    throw error;
  }
};

/**
 * Export single cart to CSV (AP-HIGH-001: Export functionality)
 * @param cartId - The cart ID to export
 * @returns Promise<Blob> CSV file as blob
 */
export const exportCart = async (cartId: string): Promise<Blob> => {
  try {
    // Use fetch directly to get blob response
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/carts/${cartId}/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to export cart: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('[Admin Cart API] Error exporting cart:', error);
    throw error;
  }
};

/**
 * Bulk delete carts (AP-HIGH-002: Bulk actions)
 * @param request - Bulk delete request with cart IDs
 * @returns Promise<BulkOperationResponse> Bulk operation response
 */
export const bulkDeleteCarts = async (
  request: BulkDeleteCartsRequest
): Promise<BulkOperationResponse> => {
  try {
    // Use fetch directly to handle DELETE with body
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/carts/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to bulk delete carts');
    }

    return await response.json();
  } catch (error) {
    console.error('[Admin Cart API] Error bulk deleting carts:', error);
    throw error;
  }
};

/**
 * Bulk clear carts (AP-HIGH-002: Bulk actions)
 * @param request - Bulk clear request with cart IDs
 * @returns Promise<BulkOperationResponse> Bulk operation response
 */
export const bulkClearCarts = async (
  request: BulkClearCartsRequest
): Promise<BulkOperationResponse> => {
  try {
    // Use fetch directly to handle DELETE with body
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/carts/bulk/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to bulk clear carts');
    }

    return await response.json();
  } catch (error) {
    console.error('[Admin Cart API] Error bulk clearing carts:', error);
    throw error;
  }
};

/**
 * Bulk update cart status (AP-HIGH-002: Bulk actions)
 * @param request - Bulk update request with cart IDs and status
 * @returns Promise<BulkOperationResponse> Bulk operation response
 */
export const bulkUpdateCartStatus = async (
  request: BulkUpdateCartStatusRequest
): Promise<BulkOperationResponse> => {
  try {
    const response = await apiClient.put<BulkOperationResponse>(
      '/admin/carts/bulk/status',
      request
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error bulk updating cart status:', error);
    throw error;
  }
};

/**
 * Cleanup expired carts (new cleanup service)
 * @param options - Cleanup options
 * @returns Promise<CleanupResponse> Cleanup response
 */
export const cleanupExpiredCartsNew = async (
  options?: { dryRun?: boolean; batchSize?: number }
): Promise<CleanupResponse> => {
  try {
    const response = await apiClient.post<CleanupResponse>(
      '/admin/carts/cleanup/expired',
      options || {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error cleaning up expired carts:', error);
    throw error;
  }
};

/**
 * Cleanup expired reservations
 * @returns Promise<CleanupResponse> Cleanup response
 */
export const cleanupExpiredReservations = async (): Promise<CleanupResponse> => {
  try {
    const response = await apiClient.post<CleanupResponse>(
      '/admin/carts/cleanup/reservations',
      {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error cleaning up expired reservations:', error);
    throw error;
  }
};

/**
 * Cleanup abandoned carts
 * @param options - Cleanup options
 * @returns Promise<AbandonedCleanupResponse> Cleanup response
 */
export const cleanupAbandonedCarts = async (
  options?: { thresholdDays?: number; sendReminders?: boolean; dryRun?: boolean }
): Promise<AbandonedCleanupResponse> => {
  try {
    const response = await apiClient.post<AbandonedCleanupResponse>(
      '/admin/carts/cleanup/abandoned',
      options || {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error cleaning up abandoned carts:', error);
    throw error;
  }
};

/**
 * Run full cleanup
 * @param options - Cleanup options
 * @returns Promise<FullCleanupResponse> Cleanup response
 */
export const runFullCleanup = async (
  options?: {
    includeReservations?: boolean;
    includeAbandoned?: boolean;
    sendReminders?: boolean;
  }
): Promise<FullCleanupResponse> => {
  try {
    const response = await apiClient.post<FullCleanupResponse>(
      '/admin/carts/cleanup/full',
      options || {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error running full cleanup:', error);
    throw error;
  }
};

/**
 * Send recovery reminders
 * @param options - Reminder options
 * @returns Promise<ReminderResponse> Reminder response
 */
export const sendRecoveryReminders = async (
  options?: { thresholdDays?: number; batchSize?: number }
): Promise<ReminderResponse> => {
  try {
    const response = await apiClient.post<ReminderResponse>(
      '/admin/carts/cleanup/reminders',
      options || {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error sending recovery reminders:', error);
    throw error;
  }
};

/**
 * Get cleanup statistics
 * @param dateRange - Date range options
 * @returns Promise<CleanupStatsResponse> Stats response
 */
export const getCleanupStats = async (
  dateRange?: { startDate?: string; endDate?: string }
): Promise<CleanupStatsResponse> => {
  try {
    let url = '/admin/carts/cleanup/stats';
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
      url = `/admin/carts/cleanup/stats?${queryParams.toString()}`;
    }
    const response = await apiClient.get<CleanupStatsResponse>(url);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting cleanup stats:', error);
    throw error;
  }
};

/**
 * Get cleanup history
 * @param params - Pagination and filter params
 * @returns Promise<CleanupHistoryResponse> History response
 */
export const getCleanupHistory = async (
  params?: { page?: number; limit?: number; type?: string }
): Promise<CleanupHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/carts/cleanup/history?${queryString}`
      : '/admin/carts/cleanup/history';
    const response = await apiClient.get<CleanupHistoryResponse>(url);
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting cleanup history:', error);
    throw error;
  }
};

/**
 * Start cleanup scheduler
 * @returns Promise<SchedulerResponse> Scheduler response
 */
export const startCleanupScheduler = async (): Promise<SchedulerResponse> => {
  try {
    const response = await apiClient.post<SchedulerResponse>(
      '/admin/carts/cleanup/schedule/start',
      {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error starting cleanup scheduler:', error);
    throw error;
  }
};

/**
 * Stop cleanup scheduler
 * @returns Promise<SchedulerResponse> Scheduler response
 */
export const stopCleanupScheduler = async (): Promise<SchedulerResponse> => {
  try {
    const response = await apiClient.post<SchedulerResponse>(
      '/admin/carts/cleanup/schedule/stop',
      {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error stopping cleanup scheduler:', error);
    throw error;
  }
};

/**
 * Get scheduler status
 * @returns Promise<SchedulerStatusResponse> Status response
 */
export const getSchedulerStatus = async (): Promise<SchedulerStatusResponse> => {
  try {
    const response = await apiClient.get<SchedulerStatusResponse>(
      '/admin/carts/cleanup/schedule/status'
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error getting scheduler status:', error);
    throw error;
  }
};

/**
 * Run a scheduled job manually
 * @param jobName - Name of the job to run
 * @returns Promise<RunJobResponse> Job run response
 */
export const runScheduledJob = async (jobName: string): Promise<RunJobResponse> => {
  try {
    const response = await apiClient.post<RunJobResponse>(
      `/admin/carts/cleanup/schedule/run/${jobName}`,
      {}
    );
    return response;
  } catch (error) {
    console.error('[Admin Cart API] Error running scheduled job:', error);
    throw error;
  }
};

// Export all admin cart API functions
export default {
  getCarts,
  getCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartAnalytics,
  cleanupExpiredCarts,
  exportCarts,
  exportCart,
  bulkDeleteCarts,
  bulkClearCarts,
  bulkUpdateCartStatus,
  // Cleanup functions
  cleanupExpiredCartsNew,
  cleanupExpiredReservations,
  cleanupAbandonedCarts,
  runFullCleanup,
  sendRecoveryReminders,
  getCleanupStats,
  getCleanupHistory,
  startCleanupScheduler,
  stopCleanupScheduler,
  getSchedulerStatus,
  runScheduledJob,
};
