/**
 * Admin Cart-Wishlist API Client
 *
 * This file provides methods for interacting with admin cart-wishlist API endpoints.
 * It follows existing API client pattern and requires appropriate permissions.
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Sync status overview for system-wide monitoring
 */
export interface SyncDashboardData {
  totalSyncs: number;
  activeSyncs: number;
  completedSyncs: number;
  failedSyncs: number;
  recentSyncs: Array<{
    userId: string;
    userName: string;
    status: string;
    lastSyncAt: string;
    errorMessage?: string;
  }>;
  performanceMetrics: {
    averageSyncTime: number;
    successRate: number;
  };
}

/**
 * Recent sync entry
 */
export interface RecentSync {
  userId: string;
  userName: string;
  status: string;
  lastSyncAt: string;
  errorMessage?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  averageSyncTime: number;
  successRate: number;
}

/**
 * Sync conflict data
 */
export interface ConflictData {
  id: string;
  userId: string;
  userName: string;
  type: string;
  data: {
    cartVersion: any;
    wishlistVersion: any;
    timestamp: string;
  };
  createdAt: string;
  status: string;
}

/**
 * Conflict resolution request
 */
export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge';
  adminNote?: string;
}

/**
 * Bulk conflict resolution request
 */
export interface BulkConflictResolutionRequest {
  conflictIds: string[];
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge';
  adminNote?: string;
}

/**
 * System analytics data
 */
export interface SystemAnalytics {
  cartActivity: {
    totalAdds: number;
    totalRemoves: number;
    totalViews: number;
  };
  wishlistActivity: {
    totalAdds: number;
    totalRemoves: number;
    totalViews: number;
  };
  moveOperations: {
    cartToWishlist: number;
    wishlistToCart: number;
    total: number;
  };
  syncStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
  };
  conflictStats: {
    totalConflicts: number;
    resolvedConflicts: number;
    pendingConflicts: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Behavior analytics data
 */
export interface BehaviorAnalytics {
  userBehavior: Array<{
    userId: string;
    userName: string;
    cartAdds: number;
    cartRemoves: number;
    wishlistAdds: number;
    wishlistRemoves: number;
    moveOperations: number;
  }>;
  timeInCart: {
    average: number;
    median: number;
    max: number;
  };
  timeInWishlist: {
    average: number;
    median: number;
    max: number;
  };
  movePatterns: {
    cartToWishlist: number;
    wishlistToCart: number;
    cartToWishlistToCart: number;
  };
}

/**
 * Conversion analytics data
 */
export interface ConversionAnalytics {
  funnel: {
    views: number;
    cartAdds: number;
    wishlistAdds: number;
    cartToWishlistMoves: number;
    wishlistToCartMoves: number;
    checkouts: number;
  };
  conversionRates: {
    viewToCart: number;
    viewToWishlist: number;
    cartToCheckout: number;
    wishlistToCart: number;
    wishlistToCheckout: number;
  };
  topConvertedProducts: Array<{
    productId: string;
    productName: string;
    cartConversions: number;
    wishlistConversions: number;
  }>;
}

/**
 * Abandonment analytics data
 */
export interface AbandonmentAnalytics {
  cartAbandonment: {
    totalAbandoned: number;
    abandonmentRate: number;
    averageTimeBeforeAbandon: number;
  };
  wishlistAbandonment: {
    totalAbandoned: number;
    abandonmentRate: number;
    averageTimeBeforeAbandon: number;
  };
  abandonmentTrend: Array<{
    date: string;
    cartAbandonments: number;
    wishlistAbandonments: number;
  }>;
  topAbandonedProducts: Array<{
    productId: string;
    productName: string;
    cartAbandonments: number;
    wishlistAbandonments: number;
  }>;
}

/**
 * Move history entry
 */
export interface MoveHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  moveType: 'cart_to_wishlist' | 'wishlist_to_cart';
  quantity: number;
  sourceId: string;
  destinationId: string;
  createdAt: string;
}

/**
 * Move history response with pagination
 */
export interface MoveHistoryResponse {
  history: MoveHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * User behavior data
 */
export interface UserBehaviorData {
  userId: string;
  userName: string;
  email: string;
  cartActivity: {
    totalAdds: number;
    totalRemoves: number;
    currentCartItems: number;
  };
  wishlistActivity: {
    totalAdds: number;
    totalRemoves: number;
    currentWishlistItems: number;
  };
  moveHistory: Array<{
    type: string;
    productId: string;
    productName: string;
    quantity: number;
    timestamp: string;
  }>;
  syncHistory: Array<{
    status: string;
    lastSyncAt: string;
    errorMessage?: string;
  }>;
  conflicts: Array<{
    id: string;
    type: string;
    createdAt: string;
    status: string;
  }>;
}

/**
 * User search result
 */
export interface UserSearchResult {
  userId: string;
  userName: string;
  email: string;
  role: string;
}

/**
 * Report generation request
 */
export interface ReportGenerationRequest {
  format: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
  include?: Array<'sync' | 'conflicts' | 'moves' | 'analytics'>;
}

/**
 * Report generation response
 */
export interface ReportGenerationResponse {
  reportId: string;
  format: string;
  downloadUrl: string;
  expiresAt: string;
}

// ============================================================================
// Sync Status APIs
// ============================================================================

/**
 * Get system-wide sync status
 * @returns Promise<SyncDashboardData> System sync status
 */
export const getSystemSyncStatus = async (): Promise<SyncDashboardData> => {
  try {
    const response = await apiClient.get<SyncDashboardData>(
      '/admin/cart-wishlist/sync/status'
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting system sync status:', error);
    throw error;
  }
};

/**
 * Get recent sync operations
 * @param params - Query parameters
 * @returns Promise<{ syncs: RecentSync[] }> Recent syncs
 */
export const getRecentSyncs = async (
  params?: { limit?: number; status?: string }
): Promise<{ syncs: RecentSync[] }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/cart-wishlist/sync/recent?${queryString}`
      : '/admin/cart-wishlist/sync/recent';
    
    const response = await apiClient.get<{ syncs: RecentSync[] }>(url);
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting recent syncs:', error);
    throw error;
  }
};

// ============================================================================
// Conflict Resolution APIs
// ============================================================================

/**
 * Get all conflicts
 * @param params - Query parameters
 * @returns Promise<{ conflicts: ConflictData[] }> Conflicts list
 */
export const getAllConflicts = async (
  params?: { userId?: string; status?: string }
): Promise<{ conflicts: ConflictData[] }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/cart-wishlist/conflicts?${queryString}`
      : '/admin/cart-wishlist/conflicts';
    
    const response = await apiClient.get<{ conflicts: ConflictData[] }>(url);
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting conflicts:', error);
    throw error;
  }
};

/**
 * Resolve a single conflict
 * @param conflictId - The conflict ID
 * @param resolution - Resolution type
 * @param adminNote - Optional admin note
 * @returns Promise<{ success: boolean }> Success response
 */
export const resolveConflictAdmin = async (
  conflictId: string,
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge',
  adminNote?: string
): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/admin/cart-wishlist/conflicts/${conflictId}/resolve`,
      { resolution, adminNote }
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error resolving conflict:', error);
    throw error;
  }
};

/**
 * Bulk resolve conflicts
 * @param conflictIds - Array of conflict IDs
 * @param resolution - Resolution type
 * @param adminNote - Optional admin note
 * @returns Promise<{ success: boolean; resolvedCount: number }> Success response
 */
export const bulkResolveConflicts = async (
  conflictIds: string[],
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge',
  adminNote?: string
): Promise<{ success: boolean; resolvedCount: number }> => {
  try {
    const response = await apiClient.post<{ success: boolean; resolvedCount: number }>(
      '/admin/cart-wishlist/conflicts/bulk-resolve',
      { conflictIds, resolution, adminNote }
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error bulk resolving conflicts:', error);
    throw error;
  }
};

// ============================================================================
// Analytics APIs
// ============================================================================

/**
 * Get system analytics
 * @param params - Date range parameters
 * @returns Promise<SystemAnalytics> System analytics data
 */
export const getSystemAnalytics = async (
  params?: { startDate?: string; endDate?: string }
): Promise<SystemAnalytics> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/cart-wishlist/analytics/system?${queryString}`
      : '/admin/cart-wishlist/analytics/system';
    
    const response = await apiClient.get<SystemAnalytics>(url);
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting system analytics:', error);
    throw error;
  }
};

/**
 * Get behavior analytics
 * @param params - Date range parameters
 * @returns Promise<BehaviorAnalytics> Behavior analytics data
 */
export const getBehaviorAnalytics = async (
  params?: { startDate?: string; endDate?: string }
): Promise<BehaviorAnalytics> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/cart-wishlist/analytics/behavior?${queryString}`
      : '/admin/cart-wishlist/analytics/behavior';
    
    const response = await apiClient.get<BehaviorAnalytics>(url);
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting behavior analytics:', error);
    throw error;
  }
};

/**
 * Get conversion analytics
 * @returns Promise<ConversionAnalytics> Conversion analytics data
 */
export const getConversionAnalytics = async (): Promise<ConversionAnalytics> => {
  try {
    const response = await apiClient.get<ConversionAnalytics>(
      '/admin/cart-wishlist/analytics/conversion'
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting conversion analytics:', error);
    throw error;
  }
};

/**
 * Get abandonment analytics
 * @returns Promise<AbandonmentAnalytics> Abandonment analytics data
 */
export const getAbandonmentAnalytics = async (): Promise<AbandonmentAnalytics> => {
  try {
    const response = await apiClient.get<AbandonmentAnalytics>(
      '/admin/cart-wishlist/analytics/abandonment'
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting abandonment analytics:', error);
    throw error;
  }
};

/**
 * Get performance metrics
 * @returns Promise<PerformanceMetrics> Performance metrics data
 */
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  try {
    const response = await apiClient.get<PerformanceMetrics>(
      '/admin/cart-wishlist/analytics/performance'
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting performance metrics:', error);
    throw error;
  }
};

/**
 * Generate and download report
 * @param params - Report generation parameters
 * @returns Promise<Blob> Report file as blob
 */
export const generateReport = async (
  params: ReportGenerationRequest
): Promise<Blob> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/cart-wishlist/analytics/report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(params)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('[Admin CartWishlist API] Error generating report:', error);
    throw error;
  }
};

// ============================================================================
// Move History APIs
// ============================================================================

/**
 * Get move history with pagination
 * @param params - Query parameters
 * @returns Promise<MoveHistoryResponse> Move history with pagination
 */
export const getMoveHistoryAdmin = async (
  params?: {
    userId?: string;
    productId?: string;
    moveType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<MoveHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.moveType) queryParams.append('moveType', params.moveType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/cart-wishlist/moves?${queryString}`
      : '/admin/cart-wishlist/moves';
    
    const response = await apiClient.get<MoveHistoryResponse>(url);
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting move history:', error);
    throw error;
  }
};

// ============================================================================
// User Behavior APIs
// ============================================================================

/**
 * Get user behavior data
 * @param userId - The user ID
 * @returns Promise<UserBehaviorData> User behavior data
 */
export const getUserBehaviorData = async (
  userId: string
): Promise<UserBehaviorData> => {
  try {
    const response = await apiClient.get<UserBehaviorData>(
      `/admin/cart-wishlist/users/${userId}/behavior`
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error getting user behavior data:', error);
    throw error;
  }
};

/**
 * Search users by email or name
 * @param query - Search query
 * @returns Promise<{ users: UserSearchResult[] }> Search results
 */
export const searchUsers = async (
  query: string
): Promise<{ users: UserSearchResult[] }> => {
  try {
    const response = await apiClient.get<{ users: UserSearchResult[] }>(
      `/admin/cart-wishlist/users/search?q=${encodeURIComponent(query)}`
    );
    return response;
  } catch (error) {
    console.error('[Admin CartWishlist API] Error searching users:', error);
    throw error;
  }
};

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Sync Status
  getSystemSyncStatus,
  getRecentSyncs,
  
  // Conflicts
  getAllConflicts,
  resolveConflictAdmin,
  bulkResolveConflicts,
  
  // Analytics
  getSystemAnalytics,
  getBehaviorAnalytics,
  getConversionAnalytics,
  getAbandonmentAnalytics,
  getPerformanceMetrics,
  generateReport,
  
  // Move History
  getMoveHistoryAdmin,
  
  // User Behavior
  getUserBehaviorData,
  searchUsers,
};
