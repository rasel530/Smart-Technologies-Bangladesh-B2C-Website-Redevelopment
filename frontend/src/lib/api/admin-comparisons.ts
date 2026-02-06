/**
 * Admin Comparison API Client
 *
 * This file contains all API client functions for admin comparison operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';

/**
 * Admin Comparison Interface
 */
export interface AdminComparison {
  id: string;
  userId: string | null;
  sessionId: string | null;
  name: string;
  status: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  items?: any[];
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  _count?: {
    items: number;
  };
}

/**
 * Admin Comparison List Response Interface
 */
export interface AdminComparisonListResponse {
  comparisons: AdminComparison[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Admin Comparison Filters Interface
 */
export interface AdminComparisonFilters {
  page?: number;
  limit?: number;
  userId?: string;
  sessionId?: string;
  status?: 'active' | 'expired' | 'all';
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Admin Comparison Statistics Interface
 */
export interface AdminComparisonStats {
  totalComparisons: number;
  activeComparisons: number;
  expiredComparisons: number;
  userComparisons: number;
  guestComparisons: number;
  totalItems: number;
  avgItemsPerComparison: number;
  topComparedProducts: {
    productId: string;
    _count: {
      productId: number;
    };
    product?: {
      id: string;
      name: string;
      nameEn: string | null;
      slug: string;
      regularPrice: number;
      salePrice: number | null;
      images: any[];
    };
  }[];
}

/**
 * Admin Comparison Analytics Interface
 */
export interface AdminComparisonAnalytics {
  period: string;
  groupBy: string;
  timeline: {
    date: string;
    comparisons: number;
    totalItems: number;
  }[];
  topUsers: {
    userId: string;
    _count: {
      userId: number;
    };
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  actionDistribution: {
    action: string;
    count: number;
  }[];
}

/**
 * Get all comparisons for admin
 *
 * @param filters - Optional filters for comparison list
 * @returns Promise with comparison list response
 */
export const getAdminComparisons = async (
  filters?: AdminComparisonFilters
): Promise<AdminComparisonListResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.sessionId) params.append('sessionId', filters.sessionId);
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = `/admin/comparisons${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<AdminComparisonListResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching admin comparisons:', error);
    throw error;
  }
};

/**
 * Get a specific comparison by ID for admin
 *
 * @param id - Comparison ID
 * @returns Promise with comparison details
 */
export const getAdminComparison = async (id: string): Promise<{ comparison: AdminComparison }> => {
  try {
    const response = await apiClient.get<{ comparison: AdminComparison }>(
      `/admin/comparisons/${id}`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching admin comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a comparison
 *
 * @param id - Comparison ID
 * @returns Promise with success message
 */
export const deleteAdminComparison = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/admin/comparisons/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Get comparison statistics
 *
 * @param period - Optional period filter (today, week, month, year, all)
 * @returns Promise with comparison statistics
 */
export const getAdminComparisonStats = async (
  period?: 'today' | 'week' | 'month' | 'year' | 'all'
): Promise<{ period: string; stats: AdminComparisonStats; topComparedProducts: any[] }> => {
  try {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }

    const queryString = params.toString();
    const endpoint = `/admin/comparisons/stats${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<{ period: string; stats: AdminComparisonStats; topComparedProducts: any[] }>(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching comparison statistics:', error);
    throw error;
  }
};

/**
 * Get comparison analytics
 *
 * @param period - Optional period filter (today, week, month, year, all)
 * @param groupBy - Optional group by filter (day, week, month)
 * @returns Promise with comparison analytics
 */
export const getAdminComparisonAnalytics = async (
  period?: 'today' | 'week' | 'month' | 'year' | 'all',
  groupBy?: 'day' | 'week' | 'month'
): Promise<AdminComparisonAnalytics> => {
  try {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (groupBy) {
      params.append('groupBy', groupBy);
    }

    const queryString = params.toString();
    const endpoint = `/admin/comparisons/analytics${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<AdminComparisonAnalytics>(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching comparison analytics:', error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const adminComparisonsApi = {
  getAdminComparisons,
  getAdminComparison,
  deleteAdminComparison,
  getAdminComparisonStats,
  getAdminComparisonAnalytics,
};

export default adminComparisonsApi;
