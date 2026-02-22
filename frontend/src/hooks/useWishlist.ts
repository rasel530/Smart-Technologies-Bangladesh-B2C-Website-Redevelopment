/**
 * useWishlist Custom Hook
 *
 * Complete rewrite following WISHLIST_ARCHITECTURE_DESIGN.md
 * Eliminates infinite loops through proper React hook dependency management
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlistStore } from '@/stores/wishlistStore';
import {
  useWishlists,
  useCurrentWishlist,
  useWishlistItems,
  useWishlistLoading,
  useWishlistError,
  useSelectedWishlistItems,
  useDefaultWishlist,
  useCurrentWishlistItems,
} from '@/stores/wishlistStore.selectors';
import type { UseWishlistReturn, AddToWishlistResult } from '@/types/wishlist';
import type { 
  GetWishlistsParams, 
  CreateWishlistRequest, 
  UpdateWishlistRequest,
  ExportOptions 
} from '@/types/wishlist';

/**
 * useWishlist Custom Hook
 * 
 * Provides a comprehensive interface for wishlist management with:
 * - Stable function references using getState() pattern
 * - Proper useEffect dependencies
 * - Debounced visibility change handling
 */
export function useWishlist(): UseWishlistReturn {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  // ========== STATE SELECTORS (stable references) ==========
  const wishlists = useWishlists();
  const currentWishlist = useCurrentWishlist();
  const items = useWishlistItems();
  const isLoading = useWishlistLoading();
  const error = useWishlistError();
  const selectedItems = useSelectedWishlistItems();
  const defaultWishlist = useDefaultWishlist();
  const currentWishlistItems = useCurrentWishlistItems();
  
  // ========== REFS FOR DEDUPLICATION ==========
  const hasLoadedInitially = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ========== COMPUTED VALUES ==========
  
  const isInWishlist = useCallback(
    (productId: string, wishlistId?: string): boolean => {
      const targetWishlistId = wishlistId || currentWishlist?.id;
      if (!targetWishlistId) return false;
      return items.some(
        (item) => item.wishlistId === targetWishlistId && item.productId === productId
      );
    },
    [currentWishlist, items]
  );
  
  const getWishlistItemCount = useCallback(
    (id: string): number => {
      return items.filter((item) => item.wishlistId === id).length;
    },
    [items]
  );
  
  // ========== ACTION FUNCTIONS (stable with getState pattern) ==========
  // These use getState() to avoid render-time selector calls that cause infinite loops
  
  const loadWishlists = useCallback(async (params?: GetWishlistsParams) => {
    return useWishlistStore.getState().loadWishlists(params);
  }, []);
  
  const loadWishlistItems = useCallback(async (wishlistId: string) => {
    return useWishlistStore.getState().loadWishlistItems(wishlistId);
  }, []);
  
  const createWishlistAction = useCallback(async (data: CreateWishlistRequest) => {
    return useWishlistStore.getState().createWishlist(data);
  }, []);
  
  const updateWishlistAction = useCallback(async (id: string, data: UpdateWishlistRequest) => {
    return useWishlistStore.getState().updateWishlist(id, data);
  }, []);
  
  const deleteWishlistAction = useCallback(async (id: string) => {
    return useWishlistStore.getState().deleteWishlist(id);
  }, []);
  
  const setCurrentWishlistAction = useCallback(async (id: string | null) => {
    useWishlistStore.getState().setCurrentWishlist(id);
    if (id) {
      await loadWishlistItems(id);
    }
  }, [loadWishlistItems]);
  
  const addToWishlistAction = useCallback(async (wishlistId: string, productId: string) => {
    return useWishlistStore.getState().addToWishlist(wishlistId, productId);
  }, []);
  
  const removeFromWishlistAction = useCallback(async (wishlistId: string, itemId: string) => {
    return useWishlistStore.getState().removeFromWishlist(wishlistId, itemId);
  }, []);
  
  const moveToCartAction = useCallback(async (wishlistId: string, itemIds: string[]) => {
    return useWishlistStore.getState().moveToCart(wishlistId, itemIds);
  }, []);
  
  const shareWishlistAction = useCallback(async (wishlistId: string) => {
    return useWishlistStore.getState().shareWishlist(wishlistId);
  }, []);
  
  const exportWishlistAction = useCallback(async (wishlistId: string, format: 'csv' | 'pdf', options?: ExportOptions) => {
    return useWishlistStore.getState().exportWishlist(wishlistId, format, options);
  }, []);
  
  const setSelectedItemsAction = useCallback((itemIds: string[]) => {
    useWishlistStore.getState().setSelectedItems(itemIds);
  }, []);
  
  const toggleItemSelectionAction = useCallback((itemId: string) => {
    useWishlistStore.getState().toggleItemSelection(itemId);
  }, []);
  
  const clearSelectionAction = useCallback(() => {
    useWishlistStore.getState().clearSelection();
  }, []);
  
  const selectAllAction = useCallback(() => {
    useWishlistStore.getState().selectAll();
  }, []);
  
  const clearErrorAction = useCallback(() => {
    useWishlistStore.getState().clearError();
  }, []);
  
  // ========== WRAPPER ACTIONS ==========
  
  const createWishlistWithName = useCallback(
    async (name: string, isPublic: boolean = false) => {
      return createWishlistAction({ name, isPublic, isDefault: false });
    },
    [createWishlistAction]
  );
  
  const updateWishlistWithUpdates = useCallback(
    async (id: string, updates: UpdateWishlistRequest) => {
      await updateWishlistAction(id, updates);
    },
    [updateWishlistAction]
  );
  
  const addToDefaultWishlist = useCallback(
    async (productId: string): Promise<AddToWishlistResult> => {
      const target = defaultWishlist;
      if (!target) {
        const newWishlist = await createWishlistAction({ name: 'My Wishlist', isPublic: false, isDefault: false });
        return addToWishlistAction(newWishlist.id, productId);
      } else {
        return addToWishlistAction(target.id, productId);
      }
    },
    [defaultWishlist, createWishlistAction, addToWishlistAction]
  );
  
  // ========== EFFECT HOOKS ==========
  
  /**
   * Load wishlists on mount
   */
  useEffect(() => {
    if (isAuthenticated && !hasLoadedInitially.current) {
      console.log('[useWishlist] Loading wishlists...');
      hasLoadedInitially.current = true;
      
      loadWishlists().catch((err) => {
        console.error('[useWishlist] Failed to load wishlists:', err);
        hasLoadedInitially.current = false;
      });
    }
    
    if (status === 'unauthenticated') {
      hasLoadedInitially.current = false;
    }
  }, [isAuthenticated, status, loadWishlists]);
  
  /**
   * Handle tab visibility changes - debounced
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        visibilityTimeoutRef.current = setTimeout(() => {
          loadWishlists().catch(console.error);
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [isAuthenticated, loadWishlists]);
  
  // ========== RETURN ==========
  
  return {
    wishlists,
    currentWishlist,
    items,
    currentWishlistItems,
    isLoading,
    error,
    selectedItems,
    isInWishlist,
    getWishlistItemCount,
    defaultWishlist,
    loadWishlists,
    setCurrentWishlist: setCurrentWishlistAction,
    createWishlist: createWishlistWithName,
    updateWishlist: updateWishlistWithUpdates,
    deleteWishlist: deleteWishlistAction,
    addToWishlist: addToWishlistAction,
    addToDefaultWishlist,
    removeFromWishlist: removeFromWishlistAction,
    moveToCart: moveToCartAction,
    shareWishlist: shareWishlistAction,
    exportWishlist: exportWishlistAction,
    setSelectedItems: setSelectedItemsAction,
    toggleItemSelection: toggleItemSelectionAction,
    clearSelection: clearSelectionAction,
    selectAll: selectAllAction,
    clearError: clearErrorAction,
  };
}

export default useWishlist;
