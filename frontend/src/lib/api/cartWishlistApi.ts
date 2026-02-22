/**
 * Cart-Wishlist Integration API Client
 *
 * API client for cart-wishlist integration features
 * Following Phase 6 Milestone 3 specifications
 */

import apiClient from './client';
import { ApiError } from './client';

// ============================================================================
// Types
// ============================================================================

export interface MoveToWishlistResponse {
  success: boolean;
  moved: number;
  failed: number;
  errors?: Array<{ itemId: string; message: string }>;
}

export interface BulkMoveToWishlistResponse {
  success: boolean;
  moved: number;
  failed: number;
  errors?: Array<{ itemId: string; message: string }>;
}

export interface BulkMoveToCartResponse {
  success: boolean;
  moved: number;
  failed: number;
  errors?: Array<{ itemId: string; message: string }>;
}

export interface SyncStatus {
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastSyncAt: string;
  pendingOperations: number;
  syncId?: string;
}

export interface PendingSyncOperation {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncConflict {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge';
}

export interface BehaviorAnalyticsParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
}

export interface BehaviorAnalytics {
  totalMoves: number;
  cartToWishlistMoves: number;
  wishlistToCartMoves: number;
  averageTimeInCart: number;
  averageTimeInWishlist: number;
  topMovedProducts: Array<{
    productId: string;
    productName: string;
    moveCount: number;
  }>;
}

export interface ConversionAnalytics {
  wishlistToCartConversionRate: number;
  cartToWishlistConversionRate: number;
  totalWishlistItems: number;
  totalCartItems: number;
  movedToCartCount: number;
  movedToWishlistCount: number;
}

export interface AbandonmentAnalytics {
  abandonedCartItems: number;
  abandonedWishlistItems: number;
  averageAbandonmentTime: number;
  abandonmentRate: number;
}

export interface PerformanceMetrics {
  averageSyncTime: number;
  failedSyncs: number;
  successfulSyncs: number;
  lastSyncStatus: string;
  uptime: number;
}

// Admin Types
export interface AdminSyncStatus {
  totalSyncs: number;
  activeSyncs: number;
  completedSyncs: number;
  failedSyncs: number;
  pendingOperations: number;
  lastSyncAt: string | null;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface AdminSyncRecord {
  id: string;
  userId: string;
  syncStatus: string;
  syncType: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number;
  errors: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface AdminConflict {
  id: string;
  userId: string;
  type: string;
  data: any;
  timestamp: string;
  resolved: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface SystemAnalytics {
  totalUsers: number;
  activeCarts: number;
  activeWishlists: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  cartToWishlistMoves: number;
  wishlistToCartMoves: number;
}

// ============================================================================
// Integration Features
// ============================================================================

/**
 * Move a single cart item to wishlist
 * @param itemId - The cart item ID
 * @param wishlistId - Optional wishlist ID (uses default if not provided)
 * @returns Promise<MoveToWishlistResponse>
 */
export const moveCartItemToWishlist = async (
  itemId: string,
  wishlistId?: string
): Promise<MoveToWishlistResponse> => {
  try {
    const response = await apiClient.post<MoveToWishlistResponse>(
      '/cart-wishlist/integration/move-to-wishlist',
      { itemId, wishlistId }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error moving cart item to wishlist:', error);
    throw error;
  }
};

/**
 * Bulk move cart items to wishlist
 * @param itemIds - Array of cart item IDs
 * @param wishlistId - Optional wishlist ID (uses default if not provided)
 * @returns Promise<BulkMoveToWishlistResponse>
 */
export const bulkMoveCartItemsToWishlist = async (
  itemIds: string[],
  wishlistId?: string
): Promise<BulkMoveToWishlistResponse> => {
  try {
    const response = await apiClient.post<BulkMoveToWishlistResponse>(
      '/cart-wishlist/integration/bulk-move-to-wishlist',
      { itemIds, wishlistId }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error bulk moving cart items to wishlist:', error);
    throw error;
  }
};

/**
 * Move all cart items to wishlist
 * @param wishlistId - Optional wishlist ID (uses default if not provided)
 * @returns Promise<BulkMoveToWishlistResponse>
 */
export const moveAllCartItemsToWishlist = async (
  wishlistId?: string
): Promise<BulkMoveToWishlistResponse> => {
  try {
    const response = await apiClient.post<BulkMoveToWishlistResponse>(
      '/cart-wishlist/integration/move-all-to-wishlist',
      { wishlistId }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error moving all cart items to wishlist:', error);
    throw error;
  }
};

/**
 * Bulk move wishlist items to cart
 * @param itemIds - Array of wishlist item IDs
 * @param cartId - Optional cart ID (uses current cart if not provided)
 * @returns Promise<BulkMoveToCartResponse>
 */
export const bulkMoveWishlistItemsToCart = async (
  itemIds: string[],
  cartId?: string
): Promise<BulkMoveToCartResponse> => {
  try {
    const response = await apiClient.post<BulkMoveToCartResponse>(
      '/cart-wishlist/integration/bulk-move-to-cart',
      { itemIds, cartId }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error bulk moving wishlist items to cart:', error);
    throw error;
  }
};

/**
 * Move all wishlist items to cart
 * @param wishlistId - The wishlist ID
 * @param cartId - Optional cart ID (uses current cart if not provided)
 * @returns Promise<BulkMoveToCartResponse>
 */
export const moveAllWishlistItemsToCart = async (
  wishlistId: string,
  cartId?: string
): Promise<BulkMoveToCartResponse> => {
  try {
    const response = await apiClient.post<BulkMoveToCartResponse>(
      `/cart-wishlist/integration/wishlist/${wishlistId}/move-all-to-cart`,
      { cartId }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error moving all wishlist items to cart:', error);
    throw error;
  }
};

// ============================================================================
// Synchronization
// ============================================================================

/**
 * Get current sync status
 * @returns Promise<SyncStatus>
 */
export const getSyncStatus = async (): Promise<SyncStatus> => {
  try {
    const response = await apiClient.get<SyncStatus>(
      '/cart-wishlist/sync/status'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting sync status:', error);
    throw error;
  }
};

/**
 * Trigger manual sync
 * @returns Promise<SyncStatus>
 */
export const triggerSync = async (): Promise<SyncStatus> => {
  try {
    const response = await apiClient.post<SyncStatus>(
      '/cart-wishlist/sync/trigger',
      {}
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error triggering sync:', error);
    throw error;
  }
};

/**
 * Get pending sync operations
 * @returns Promise<PendingSyncOperation[]>
 */
export const getPendingSyncOperations = async (): Promise<PendingSyncOperation[]> => {
  try {
    const response = await apiClient.get<{ operations: PendingSyncOperation[] }>(
      '/cart-wishlist/sync/pending'
    );
    return response.operations || [];
  } catch (error) {
    console.error('[CartWishlist API] Error getting pending sync operations:', error);
    throw error;
  }
};

/**
 * Sync offline changes
 * @param operations - Array of pending operations
 * @returns Promise<SyncStatus>
 */
export const syncOfflineChanges = async (
  operations: PendingSyncOperation[]
): Promise<SyncStatus> => {
  try {
    const response = await apiClient.post<SyncStatus>(
      '/cart-wishlist/sync/offline',
      { operations }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error syncing offline changes:', error);
    throw error;
  }
};

/**
 * Cancel an active sync
 * @param syncId - The sync ID to cancel
 * @returns Promise<{ success: boolean }>
 */
export const cancelSync = async (syncId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/cart-wishlist/sync/${syncId}/cancel`,
      {}
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error canceling sync:', error);
    throw error;
  }
};

/**
 * Resolve a sync conflict
 * @param conflictId - The conflict ID to resolve
 * @param resolution - The resolution type
 * @returns Promise<{ success: boolean }>
 */
export const resolveConflict = async (
  conflictId: string,
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge'
): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/cart-wishlist/sync/conflicts/${conflictId}/resolve`,
      { resolution }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error resolving conflict:', error);
    throw error;
  }
};

/**
 * Get all sync conflicts
 * @returns Promise<SyncConflict[]>
 */
export const getSyncConflicts = async (): Promise<SyncConflict[]> => {
  try {
    const response = await apiClient.get<{ conflicts: SyncConflict[] }>(
      '/cart-wishlist/sync/conflicts'
    );
    return response.conflicts || [];
  } catch (error) {
    console.error('[CartWishlist API] Error getting sync conflicts:', error);
    throw error;
  }
};

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get behavior analytics
 * @param params - Query parameters for analytics
 * @returns Promise<BehaviorAnalytics>
 */
export const getBehaviorAnalytics = async (
  params: BehaviorAnalyticsParams = {}
): Promise<BehaviorAnalytics> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.userId) queryParams.set('userId', params.userId);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    
    const endpoint = `/cart-wishlist/analytics/behavior${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BehaviorAnalytics>(endpoint);
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting behavior analytics:', error);
    throw error;
  }
};

/**
 * Get conversion analytics
 * @returns Promise<ConversionAnalytics>
 */
export const getConversionAnalytics = async (): Promise<ConversionAnalytics> => {
  try {
    const response = await apiClient.get<ConversionAnalytics>(
      '/cart-wishlist/analytics/conversion'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting conversion analytics:', error);
    throw error;
  }
};

/**
 * Get abandonment analytics
 * @returns Promise<AbandonmentAnalytics>
 */
export const getAbandonmentAnalytics = async (): Promise<AbandonmentAnalytics> => {
  try {
    const response = await apiClient.get<AbandonmentAnalytics>(
      '/cart-wishlist/analytics/abandonment'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting abandonment analytics:', error);
    throw error;
  }
};

/**
 * Get performance metrics
 * @returns Promise<PerformanceMetrics>
 */
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  try {
    const response = await apiClient.get<PerformanceMetrics>(
      '/cart-wishlist/analytics/performance'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting performance metrics:', error);
    throw error;
  }
};

// ============================================================================
// Offline Queue Management
// ============================================================================

/**
 * Add operation to offline queue (stored in localStorage)
 * @param operation - The operation to queue
 */
export const addToOfflineQueue = (operation: PendingSyncOperation): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const queue = getOfflineQueue();
    queue.push(operation);
    localStorage.setItem('cartWishlistOfflineQueue', JSON.stringify(queue));
  } catch (error) {
    console.error('[CartWishlist API] Error adding to offline queue:', error);
  }
};

/**
 * Get offline queue from localStorage
 * @returns PendingSyncOperation[]
 */
export const getOfflineQueue = (): PendingSyncOperation[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const queueJson = localStorage.getItem('cartWishlistOfflineQueue');
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('[CartWishlist API] Error getting offline queue:', error);
    return [];
  }
};

/**
 * Clear offline queue from localStorage
 */
export const clearOfflineQueue = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('cartWishlistOfflineQueue');
  } catch (error) {
    console.error('[CartWishlist API] Error clearing offline queue:', error);
  }
};

/**
 * Remove operation from offline queue
 * @param operationId - The operation ID to remove
 */
export const removeFromOfflineQueue = (operationId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    localStorage.setItem('cartWishlistOfflineQueue', JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('[CartWishlist API] Error removing from offline queue:', error);
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if currently online
 * @returns boolean
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

/**
 * Add event listener for online/offline status changes
 * @param callback - Function to call when status changes
 */
export const addNetworkStatusListener = (
  callback: (isOnline: boolean) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// ============================================================================
// Admin API Endpoints
// ============================================================================

/**
 * Get admin system sync status
 * @returns Promise<AdminSyncStatus>
 */
export const getAdminSyncStatus = async (): Promise<AdminSyncStatus> => {
  try {
    const response = await apiClient.get<AdminSyncStatus>(
      '/admin/cart-wishlist/sync/status'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting admin sync status:', error);
    throw error;
  }
};

/**
 * Get recent sync records for admin dashboard
 * @param limit - Number of recent syncs to return (default: 10)
 * @returns Promise<{ success: boolean; data: AdminSyncRecord[] }>
 */
export const getAdminRecentSyncs = async (limit: number = 10): Promise<{ success: boolean; data: AdminSyncRecord[] }> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: AdminSyncRecord[] }>(
      `/admin/cart-wishlist/sync/recent?limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting admin recent syncs:', error);
    throw error;
  }
};

/**
 * Get all system conflicts for admin
 * @returns Promise<{ success: boolean; conflicts: AdminConflict[] }>
 */
export const getAdminAllConflicts = async (): Promise<{ success: boolean; conflicts: AdminConflict[] }> => {
  try {
    const response = await apiClient.get<{ success: boolean; conflicts: AdminConflict[] }>(
      '/admin/cart-wishlist/conflicts'
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting admin conflicts:', error);
    throw error;
  }
};

/**
 * Get system analytics for admin
 * @param filters - Optional filters for analytics
 * @returns Promise<SystemAnalytics>
 */
export const getAdminSystemAnalytics = async (filters: {
  startDate?: string;
  endDate?: string;
} = {}): Promise<SystemAnalytics> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.set('startDate', filters.startDate);
    if (filters.endDate) queryParams.set('endDate', filters.endDate);
    
    const endpoint = `/admin/cart-wishlist/analytics/system${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<SystemAnalytics>(endpoint);
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error getting admin system analytics:', error);
    throw error;
  }
};

/**
 * Resolve a conflict as admin
 * @param conflictId - The conflict ID to resolve
 * @param resolution - The resolution type
 * @returns Promise<{ success: boolean }>
 */
export const adminResolveConflict = async (
  conflictId: string,
  resolution: 'keep_cart' | 'keep_wishlist' | 'merge'
): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/admin/cart-wishlist/conflicts/${conflictId}/resolve`,
      { resolution }
    );
    return response;
  } catch (error) {
    console.error('[CartWishlist API] Error resolving admin conflict:', error);
    throw error;
  }
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Integration Features
  moveCartItemToWishlist,
  bulkMoveCartItemsToWishlist,
  moveAllCartItemsToWishlist,
  bulkMoveWishlistItemsToCart,
  moveAllWishlistItemsToCart,
  
  // Synchronization
  getSyncStatus,
  triggerSync,
  getPendingSyncOperations,
  syncOfflineChanges,
  cancelSync,
  resolveConflict,
  getSyncConflicts,
  
  // Analytics
  getBehaviorAnalytics,
  getConversionAnalytics,
  getAbandonmentAnalytics,
  getPerformanceMetrics,
  
  // Offline Queue Management
  addToOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
  removeFromOfflineQueue,
  
  // Utility Functions
  isOnline,
  addNetworkStatusListener,
  
  // Admin API Endpoints
  getAdminSyncStatus,
  getAdminRecentSyncs,
  getAdminAllConflicts,
  getAdminSystemAnalytics,
  adminResolveConflict,
};
