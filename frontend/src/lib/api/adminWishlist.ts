/**
 * Admin Wishlist API Client
 *
 * This file contains all API client functions for admin wishlist operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';

/**
 * Wishlist Statistics Interface
 */
export interface WishlistStatistics {
  totalWishlists: number;
  totalItems: number;
  averageItemsPerWishlist: number;
  publicWishlists: number;
  sharedWishlists: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    regularPrice: number;
    salePrice: number | null;
    images: Array<{
      originalUrl: string;
      thumbnailUrl: string;
    }>;
    wishlistCount: number;
  }>;
  creationTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Wishlist with User Interface
 */
export interface WishlistWithUser {
  id: string;
  userId: string;
  name: string | null;
  isDefault: boolean;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    items: number;
  };
}

/**
 * User Wishlist Data Interface
 */
export interface UserWishlistData {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  wishlists: WishlistWithUser[];
  totalItems: number;
  lastActivity: string | null;
}

/**
 * Wishlist Analytics Interface
 */
export interface WishlistAnalytics {
  creationRate: number;
  averageWishlistSize: number;
  abandonmentRate: number;
  conversionRate: number;
  sharingStats: {
    totalShares: number;
    totalExports: number;
  };
  eventCounts: Record<string, number>;
  creationTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Product Wishlist Analytics Interface
 */
export interface ProductWishlistAnalytics {
  id: string;
  name: string;
  sku: string;
  regularPrice: number;
  salePrice: number | null;
  categoryId: string | null;
  images: Array<{
    originalUrl: string;
    thumbnailUrl: string;
  }>;
  wishlistCount: number;
  lastAdded: string | null;
}

/**
 * Wishlist Settings Interface
 */
export interface WishlistSettings {
  maxWishlistsPerUser: number;
  maxItemsPerWishlist: number;
  defaultPrivacy: 'private' | 'public';
  shareTokenExpirationDays: number;
  enableSharing: boolean;
  enableExport: boolean;
  analyticsRetentionDays: number;
}

/**
 * User with Wishlist Data Interface
 */
export interface UserWithWishlistData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    wishlists: number;
  };
  totalItems: number;
  lastActivity: string | null;
}

/**
 * Get Wishlist Statistics
 *
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Promise with wishlist statistics
 */
export const getWishlistStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<WishlistStatistics> => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const endpoint = `/admin/wishlists/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<WishlistStatistics>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching statistics:', error);
    throw error;
  }
};

/**
 * Get All Wishlists
 *
 * @param params - Query parameters for pagination and filtering
 * @returns Promise with paginated wishlists
 */
export const getAllWishlists = async (
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    isPublic?: boolean;
    userId?: string;
  }
): Promise<{ wishlists: WishlistWithUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.isPublic !== undefined) queryParams.set('isPublic', params.isPublic.toString());
    if (params?.userId) queryParams.set('userId', params.userId);

    const endpoint = `/admin/wishlists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{
      wishlists: WishlistWithUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching all wishlists:', error);
    throw error;
  }
};

/**
 * Get Users with Wishlists
 *
 * @param params - Query parameters for pagination and search
 * @returns Promise with paginated users
 */
export const getUsersWithWishlists = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<{ users: UserWithWishlistData[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);

    const endpoint = `/admin/wishlists/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{
      users: UserWithWishlistData[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching users with wishlists:', error);
    throw error;
  }
};

/**
 * Get User Wishlists
 *
 * @param userId - User ID
 * @returns Promise with user wishlist data
 */
export const getUserWishlists = async (
  userId: string
): Promise<UserWishlistData> => {
  try {
    const response = await apiClient.get<UserWishlistData>(`/admin/wishlists/users/${userId}`);
    return response;
  } catch (error) {
    console.error(`[Admin Wishlist API] Error fetching user ${userId} wishlists:`, error);
    throw error;
  }
};

/**
 * Delete Wishlist (Admin Override)
 *
 * @param wishlistId - Wishlist ID
 * @returns Promise with success message
 */
export const deleteWishlist = async (
  wishlistId: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/admin/wishlists/${wishlistId}`);
    return response;
  } catch (error) {
    console.error(`[Admin Wishlist API] Error deleting wishlist ${wishlistId}:`, error);
    throw error;
  }
};

/**
 * Get Wishlist Analytics
 *
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @param groupBy - Group by period (day, week, month)
 * @returns Promise with wishlist analytics
 */
export const getWishlistAnalytics = async (
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<WishlistAnalytics> => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    queryParams.set('groupBy', groupBy);

    const endpoint = `/admin/wishlists/analytics?${queryParams.toString()}`;
    const response = await apiClient.get<WishlistAnalytics>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching analytics:', error);
    throw error;
  }
};

/**
 * Get Product Wishlist Analytics
 *
 * @param params - Query parameters for pagination and filtering
 * @returns Promise with product wishlist data
 */
export const getProductAnalytics = async (
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<{ products: ProductWishlistAnalytics[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
    if (params?.minPrice) queryParams.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString());

    const endpoint = `/admin/wishlists/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{
      products: ProductWishlistAnalytics[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching product analytics:', error);
    throw error;
  }
};

/**
 * Get Wishlist Settings
 *
 * @returns Promise with wishlist settings
 */
export const getWishlistSettings = async (): Promise<WishlistSettings> => {
  try {
    const response = await apiClient.get<WishlistSettings>('/admin/wishlists/settings');
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching settings:', error);
    throw error;
  }
};

/**
 * Update Wishlist Settings
 *
 * @param settings - Settings to update
 * @returns Promise with updated settings
 */
export const updateWishlistSettings = async (
  settings: Partial<WishlistSettings>
): Promise<WishlistSettings> => {
  try {
    const response = await apiClient.put<WishlistSettings>('/admin/wishlists/settings', settings);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error updating settings:', error);
    throw error;
  }
};

/**
 * Get Moderation Queue
 *
 * @param params - Query parameters for pagination and filtering
 * @returns Promise with moderation queue
 */
export const getModerationQueue = async (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<{ wishlists: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);

    const endpoint = `/admin/wishlists/moderation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{
      wishlists: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(endpoint);
    return response;
  } catch (error) {
    console.error('[Admin Wishlist API] Error fetching moderation queue:', error);
    throw error;
  }
};

/**
 * Approve Wishlist in Moderation
 *
 * @param wishlistId - Wishlist ID
 * @returns Promise with success message
 */
export const approveWishlist = async (
  wishlistId: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(`/admin/wishlists/moderation/${wishlistId}/approve`);
    return response;
  } catch (error) {
    console.error(`[Admin Wishlist API] Error approving wishlist ${wishlistId}:`, error);
    throw error;
  }
};

/**
 * Reject Wishlist in Moderation
 *
 * @param wishlistId - Wishlist ID
 * @param reason - Rejection reason
 * @returns Promise with success message
 */
export const rejectWishlist = async (
  wishlistId: string,
  reason: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(`/admin/wishlists/moderation/${wishlistId}/reject`, { reason });
    return response;
  } catch (error) {
    console.error(`[Admin Wishlist API] Error rejecting wishlist ${wishlistId}:`, error);
    throw error;
  }
};

/**
 * Export all functions as a named object for convenience
 */
const adminWishlistApi = {
  getWishlistStatistics,
  getAllWishlists,
  getUsersWithWishlists,
  getUserWishlists,
  deleteWishlist,
  getWishlistAnalytics,
  getProductAnalytics,
  getWishlistSettings,
  updateWishlistSettings,
  getModerationQueue,
  approveWishlist,
  rejectWishlist,
};

export default adminWishlistApi;
