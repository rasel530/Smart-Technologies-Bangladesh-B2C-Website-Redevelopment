/**
 * Wishlist Zustand Store
 *
 * Complete rewrite following WISHLIST_ARCHITECTURE_DESIGN.md
 * Eliminates infinite loops through proper React hook dependency management
 */

import { create } from 'zustand';
import type {
  Wishlist,
  WishlistItemWithProduct,
  CreateWishlistRequest,
  UpdateWishlistRequest,
  ShareWishlistResponse,
  GetWishlistsParams,
  MoveToCartResponse,
  ExportOptions,
} from '@/types/wishlist';
import wishlistApi from '@/lib/api/wishlist';

/**
 * Wishlist Store State Interface
 */
interface WishlistStoreState {
  // Core state
  wishlists: Wishlist[];
  currentWishlistId: string | null;
  items: WishlistItemWithProduct[];
  
  // UI state
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  selectedItems: string[];
  
  // Tracking state (for deduplication)
  lastLoadedAt: number | null;
}

/**
 * Wishlist Store Actions Interface
 */
interface WishlistStoreActions {
  // Async actions
  loadWishlists: (params?: GetWishlistsParams) => Promise<void>;
  loadWishlistItems: (wishlistId: string) => Promise<void>;
  createWishlist: (data: CreateWishlistRequest) => Promise<Wishlist>;
  updateWishlist: (id: string, data: UpdateWishlistRequest) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
  
  // Item actions
  addToWishlist: (wishlistId: string, productId: string) => Promise<void>;
  removeFromWishlist: (wishlistId: string, itemId: string) => Promise<void>;
  moveToCart: (wishlistId: string, itemIds: string[]) => Promise<MoveToCartResponse>;
  
  // Share/Export actions
  shareWishlist: (wishlistId: string) => Promise<ShareWishlistResponse>;
  exportWishlist: (wishlistId: string, format: 'csv' | 'pdf', options?: ExportOptions) => Promise<Blob>;
  
  // Selection actions
  setSelectedItems: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Wishlist navigation
  setCurrentWishlist: (id: string | null) => void;
  
  // Utility actions
  clearError: () => void;
  invalidateCache: () => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState: WishlistStoreState = {
  wishlists: [],
  currentWishlistId: null,
  items: [],
  isLoading: false,
  isInitializing: true,
  error: null,
  selectedItems: [],
  lastLoadedAt: null,
};

/**
 * Request deduplication using refs
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Create the wishlist store
 */
export const useWishlistStore = create<WishlistStoreState & WishlistStoreActions>()((set, get) => ({
  ...initialState,

  /**
   * Load all wishlists with deduplication
   */
  loadWishlists: async (params?: GetWishlistsParams) => {
    const state = get();
    const requestKey = `loadWishlists_${JSON.stringify(params || {})}`;
    
    // Check for pending request
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    
    // Check if recently loaded (5 second cache)
    if (state.lastLoadedAt && Date.now() - state.lastLoadedAt < 5000 && !state.error) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    const requestPromise = (async () => {
      try {
        const response = await wishlistApi.getWishlists(params);
         
        set({
          wishlists: response.wishlists,
          isLoading: false,
          isInitializing: false,
          lastLoadedAt: Date.now(),
        });
         
        return response;
      } catch (error) {
        set({
          isLoading: false,
          isInitializing: false,
          error: error instanceof Error ? error.message : 'Failed to load wishlists',
        });
        throw error;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },

  /**
   * Load items for a specific wishlist
   */
  loadWishlistItems: async (wishlistId: string) => {
    const state = get();
    const requestKey = `loadItems_${wishlistId}`;
    
    // Check for pending request
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    
    set({ isLoading: true, error: null });
    
    const requestPromise = (async () => {
      try {
        const response = await wishlistApi.getWishlistById(wishlistId);
        
        set({
          items: response.items,
          currentWishlistId: wishlistId,
          isLoading: false,
        });
           
        return response;
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load wishlist items',
        });
        throw error;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },

  /**
   * Create a new wishlist
   */
  createWishlist: async (data: CreateWishlistRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const newWishlist = await wishlistApi.createWishlist(data);
      
      set((state) => ({
        wishlists: [...state.wishlists, newWishlist],
        isLoading: false,
      }));
      
      return newWishlist;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create wishlist',
      });
      throw error;
    }
  },

  /**
   * Update a wishlist
   */
  updateWishlist: async (id: string, data: UpdateWishlistRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedWishlist = await wishlistApi.updateWishlist(id, data);
      
      set((state) => ({
        wishlists: state.wishlists.map((w) => (w.id === id ? updatedWishlist : w)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update wishlist',
      });
      throw error;
    }
  },

  /**
   * Delete a wishlist
   */
  deleteWishlist: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await wishlistApi.deleteWishlist(id);
      
      set((state) => ({
        wishlists: state.wishlists.filter((w) => w.id !== id),
        items: state.items.filter((item) => item.wishlistId !== id),
        currentWishlistId: state.currentWishlistId === id ? null : state.currentWishlistId,
        selectedItems: state.selectedItems.filter((itemId) => {
          const item = state.items.find((i) => i.id === itemId);
          return item?.wishlistId !== id;
        }),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete wishlist',
      });
      throw error;
    }
  },

  /**
   * Add a product to a wishlist
   */
  addToWishlist: async (wishlistId: string, productId: string) => {
    const state = get();
    
    // Check for duplicates locally
    const existingItem = state.items.find(
      (item) => item.wishlistId === wishlistId && item.productId === productId
    );
    
    if (existingItem) {
      throw new Error('Product already exists in this wishlist');
    }
    
    set({ isLoading: true, error: null });
    
    try {
      await wishlistApi.addItemToWishlist(wishlistId, productId);
      
      // Refresh items to get full product details
      const response = await wishlistApi.getWishlistById(wishlistId);
      
      set({
        items: response.items,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add to wishlist',
      });
      throw error;
    }
  },

  /**
   * Remove an item from a wishlist
   */
  removeFromWishlist: async (wishlistId: string, itemId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await wishlistApi.removeItemFromWishlist(wishlistId, itemId);
      const state = get();
      
      const newItems = state.items.filter((item) => item.id !== itemId);
      const newSelectedItems = state.selectedItems.filter((id) => id !== itemId);
      
      set({
        items: newItems,
        selectedItems: newSelectedItems,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove from wishlist',
      });
      throw error;
    }
  },

  /**
   * Move wishlist items to cart with stock validation
   */
  moveToCart: async (wishlistId: string, itemIds: string[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await wishlistApi.moveItemsToCart(wishlistId, itemIds);
      const state = get();
      
      const newItems = state.items.filter((item) => !itemIds.includes(item.id));
      const newSelectedItems = state.selectedItems.filter((id) => !itemIds.includes(id));
      
      set({
        items: newItems,
        selectedItems: newSelectedItems,
        isLoading: false,
      });
      
      return response;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to move items to cart',
      });
      throw error;
    }
  },

  /**
   * Share a wishlist
   */
  shareWishlist: async (wishlistId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await wishlistApi.shareWishlist(wishlistId);
      
      set((state) => ({
        wishlists: state.wishlists.map((w) =>
          w.id === wishlistId ? { ...w, shareToken: response.shareToken } : w
        ),
        isLoading: false,
      }));
      
      return response;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to share wishlist',
      });
      throw error;
    }
  },

  /**
   * Export a wishlist
   */
  exportWishlist: async (
    wishlistId: string,
    format: 'csv' | 'pdf',
    options?: ExportOptions
  ) => {
    set({ isLoading: true, error: null });
    
    try {
      const blob = await wishlistApi.exportWishlist(wishlistId, format, options);
      set({ isLoading: false });
      return blob;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to export wishlist',
      });
      throw error;
    }
  },

  /**
   * Set selected items
   */
  setSelectedItems: (itemIds: string[]) => {
    set({ selectedItems: itemIds });
  },

  /**
   * Toggle item selection
   */
  toggleItemSelection: (itemId: string) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId],
    }));
  },

  /**
   * Clear selection
   */
  clearSelection: () => {
    set({ selectedItems: [] });
  },

  /**
   * Select all items in current wishlist
   */
  selectAll: () => {
    const { currentWishlistId, items } = get();
    if (!currentWishlistId) {
      set({ selectedItems: [] });
      return;
    }
    
    const currentItems = items.filter(
      (item) => item.wishlistId === currentWishlistId
    );
    
    set({ selectedItems: currentItems.map((item) => item.id) });
  },

  /**
   * Set current wishlist (decoupled from item loading)
   */
  setCurrentWishlist: (id: string | null) => {
    set({ currentWishlistId: id });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Invalidate cache - called when user logs out or switches accounts
   */
  invalidateCache: () => {
    // Clear pending requests
    pendingRequests.clear();
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    // Clear pending requests when resetting store
    pendingRequests.clear();
    set(initialState);
  },
}));
