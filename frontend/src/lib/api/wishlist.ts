/**
 * Wishlist API Client
 *
 * BUG-MED-003: Mock data in AddToWishlist.tsx - Created API client for wishlist functionality
 * 
 * This file contains all API client functions for wishlist operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';

/**
 * Wishlist Interface
 */
export interface Wishlist {
  id: string;
  name: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Wishlist Request Interface
 */
export interface CreateWishlistRequest {
  name: string;
  productIds?: string[];
}

/**
 * Get all wishlists for current user
 *
 * @returns Promise with wishlist list
 */
export const getWishlists = async (): Promise<{ wishlists: Wishlist[] }> => {
  try {
    const response = await apiClient.get<{ wishlists: Wishlist[] }>('/wishlists');
    return response;
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    throw error;
  }
};

/**
 * Create a new wishlist
 *
 * @param data - Create wishlist request data
 * @returns Promise with created wishlist
 */
export const createWishlist = async (
  data: CreateWishlistRequest
): Promise<{ wishlist: Wishlist }> => {
  try {
    const response = await apiClient.post<{ wishlist: Wishlist }>(
      '/wishlists',
      data
    );
    return response;
  } catch (error) {
    console.error('Error creating wishlist:', error);
    throw error;
  }
};

/**
 * Add products to existing wishlist
 *
 * @param wishlistId - Wishlist ID
 * @param productIds - Array of product IDs to add
 * @returns Promise with success message
 */
export const addProductsToWishlist = async (
  wishlistId: string,
  productIds: string[]
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      `/wishlists/${wishlistId}/items`,
      { productIds }
    );
    return response;
  } catch (error) {
    console.error(`Error adding products to wishlist ${wishlistId}:`, error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const wishlistApi = {
  getWishlists,
  createWishlist,
  addProductsToWishlist,
};

export default wishlistApi;
