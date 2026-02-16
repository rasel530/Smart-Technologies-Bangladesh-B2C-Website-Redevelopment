/**
 * Wishlist API Client
 * 
 * API client for wishlist operations
 * Following Milestone 2 specifications
 */

import apiClient from './client';
import type {
  Wishlist,
  WishlistItemWithProduct,
  CreateWishlistRequest,
  UpdateWishlistRequest,
  GetWishlistsParams,
  ShareWishlistResponse,
  MoveToCartResponse,
  ExportOptions,
} from '@/types/wishlist';

/**
 * Wishlist API client
 */
export const wishlistApi = {
  /**
   * Get all wishlists for the current user
   */
  getWishlists: async (params?: GetWishlistsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.includeItems) queryParams.set('includeItems', 'true');
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    const endpoint = `/wishlist${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ wishlists: Wishlist[] }>(endpoint);
  },

  /**
   * Get a specific wishlist by ID
   */
  getWishlistById: async (id: string, shareToken?: string) => {
    const queryParams = new URLSearchParams();
    if (shareToken) queryParams.set('shareToken', shareToken);
    
    const endpoint = `/wishlist/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ wishlist: Wishlist; items: WishlistItemWithProduct[] }>(endpoint);
  },

  /**
   * Create a new wishlist
   */
  createWishlist: async (data: CreateWishlistRequest) => {
    const response = await apiClient.post<{ wishlist: Wishlist }>('/wishlist', data);
    return response.wishlist;
  },

  /**
   * Update a wishlist
   */
  updateWishlist: async (id: string, data: UpdateWishlistRequest) => {
    const response = await apiClient.put<{ wishlist: Wishlist }>(`/wishlist/${id}`, data);
    return response.wishlist;
  },

  /**
   * Delete a wishlist
   */
  deleteWishlist: async (id: string) => {
    return apiClient.delete<{ success: boolean }>(`/wishlist/${id}`);
  },

  /**
   * Add an item to a wishlist
   */
  addItemToWishlist: async (wishlistId: string, productId: string) => {
    return apiClient.post<{ item: WishlistItemWithProduct }>(
      `/wishlist/${wishlistId}/items`,
      { productId }
    );
  },

  /**
   * Remove an item from a wishlist
   */
  removeItemFromWishlist: async (wishlistId: string, itemId: string) => {
    return apiClient.delete<{ success: boolean }>(
      `/wishlist/${wishlistId}/items/${itemId}`
    );
  },

  /**
   * Move items from wishlist to cart with stock validation
   */
  moveItemsToCart: async (wishlistId: string, itemIds: string[]) => {
    return apiClient.post<MoveToCartResponse>(
      `/wishlist/${wishlistId}/items/move-to-cart`,
      { itemIds }
    );
  },

  /**
   * Share a wishlist and generate share token
   */
  shareWishlist: async (wishlistId: string): Promise<ShareWishlistResponse> => {
    const response = await apiClient.post<ShareWishlistResponse>(
      `/wishlist/${wishlistId}/share`,
      {}
    );
    return response;
  },

  /**
   * Export a wishlist to CSV or PDF
   */
  exportWishlist: async (
    wishlistId: string,
    format: 'csv' | 'pdf',
    options?: ExportOptions
  ): Promise<Blob> => {
    const queryParams = new URLSearchParams({ format });
    if (options?.includeImages) queryParams.set('includeImages', 'true');
    if (options?.includeDescriptions) queryParams.set('includeDescriptions', 'true');
    if (options?.includePrices) queryParams.set('includePrices', 'true');
    if (options?.includeStockStatus) queryParams.set('includeStockStatus', 'true');
    
    const endpoint = `/wishlist/${wishlistId}/export?${queryParams.toString()}`;
    
    // For file downloads, we need to get the raw response
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export wishlist');
    }

    return response.blob();
  },
};

export default wishlistApi;
