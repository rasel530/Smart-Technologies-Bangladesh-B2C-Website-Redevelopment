# Wishlist Page Architecture Design

**Version:** 2.0  
**Date:** 2026-02-15  
**Status:** Ready for Implementation  
**Mode:** Architect

---

## Executive Summary

This architecture document provides a comprehensive design for the Wishlist page implementation that:

- **Eliminates infinite rendering loops** through proper React hook dependency management
- **Follows Milestone 2 specifications** for data model, APIs, and components
- **Integrates seamlessly** with Milestone 1 Shopping Cart Foundation
- **Uses established patterns** from CartContext (Zustand + Context, reducer-like actions, event dispatching)
- **Includes proper error handling** with toast notifications and loading states
- **Supports bilingual** English/Bengali messages

---

## Root Cause Analysis

### Critical Issues Identified

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| **#1: Unstable function references** | `useCallback` wrappers with empty dependency arrays create new functions on each render | Triggers unnecessary re-renders in components depending on these functions |
| **#2: Multiple useEffects with unstable deps** | `loadWishlists` function reference changes on every render | Infinite loop as useEffect re-triggers on dependency change |
| **#3: Cascading state updates** | `setCurrentWishlist` triggers `loadWishlistItems` synchronously | Causes race conditions and duplicate API calls |
| **#4: Inadequate deduplication** | Store lacks robust deduplication using refs | Multiple identical API requests |
| **#5: Visibility change without debounce** | Tab visibility triggers immediate reload | Unnecessary API calls when switching tabs rapidly |

### The Fix Strategy

1. **Remove ALL `useCallback` wrappers** from action selectors - use direct store selectors instead
2. **Use refs for deduplication** in useEffect hooks
3. **Remove `loadWishlists` from useEffect dependencies** - use refs to track initialization
4. **Debounce visibility change handlers** with setTimeout
5. **Add request deduplication** in the store using refs
6. **Decouple `setCurrentWishlist`** from immediate item loading

---

## State Management Architecture

### 1. Zustand Store Structure

```typescript
// frontend/src/stores/wishlistStore.ts

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  Wishlist,
  WishlistItemWithProduct,
  CreateWishlistRequest,
  UpdateWishlistRequest,
  ShareWishlistResponse,
  GetWishlistsParams,
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
  reset: () => void;
}

/**
 * Export options interface
 */
interface ExportOptions {
  includeImages?: boolean;
  includeDescriptions?: boolean;
  includePrices?: boolean;
  includeStockStatus?: boolean;
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
 * Create the wishlist store with middleware
 */
export const useWishlistStore = create<WishlistStoreState & WishlistStoreActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
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
          
          set((state) => ({
            items: response.items,
            isLoading: false,
          }));
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
          
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
            selectedItems: state.selectedItems.filter((id) => id !== itemId),
            isLoading: false,
          }));
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
          
          // Remove moved items from wishlist
          set((state) => ({
            items: state.items.filter((item) => !itemIds.includes(item.id)),
            selectedItems: state.selectedItems.filter((id) => !itemIds.includes(id)),
            isLoading: false,
          }));
          
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
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'wishlist-store',
    }
  )
);
```

### 2. Selectors for State Slices

```typescript
// frontend/src/stores/wishlistStore.selectors.ts

import { useWishlistStore } from './wishlistStore';

/**
 * Select all wishlists
 */
export const useWishlists = () => useWishlistStore((state) => state.wishlists);

/**
 * Select current wishlist
 */
export const useCurrentWishlist = () =>
  useWishlistStore((state) => {
    const { currentWishlistId, wishlists } = state;
    return wishlists.find((w) => w.id === currentWishlistId) || null;
  });

/**
 * Select wishlist items
 */
export const useWishlistItems = () => useWishlistStore((state) => state.items);

/**
 * Select current wishlist items (filtered by currentWishlistId)
 */
export const useCurrentWishlistItems = () =>
  useWishlistStore((state) => {
    const { currentWishlistId, items } = state;
    return items.filter((item) => item.wishlistId === currentWishlistId);
  });

/**
 * Select loading state
 */
export const useWishlistLoading = () =>
  useWishlistStore((state) => state.isLoading);

/**
 * Select initializing state
 */
export const useWishlistInitializing = () =>
  useWishlistStore((state) => state.isInitializing);

/**
 * Select error state
 */
export const useWishlistError = () =>
  useWishlistStore((state) => state.error);

/**
 * Select selected items
 */
export const useSelectedWishlistItems = () =>
  useWishlistStore((state) => state.selectedItems);

/**
 * Select default wishlist
 */
export const useDefaultWishlist = () =>
  useWishlistStore((state) =>
    state.wishlists.find((w) => w.isDefault) || null
  );
```

### 3. React Context Provider Wrapper

```typescript
// frontend/src/contexts/WishlistContext.tsx

'use client';

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useWishlistStore } from '@/stores/wishlistStore';
import type { Wishlist, WishlistItemWithProduct } from '@/types/wishlist';

interface WishlistProviderProps {
  children: ReactNode;
}

interface WishlistContextType {
  wishlists: Wishlist[];
  currentWishlist: Wishlist | null;
  items: WishlistItemWithProduct[];
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  selectedItems: string[];
  defaultWishlist: Wishlist | null;
  currentWishlistItems: WishlistItemWithProduct[];
  isInWishlist: (productId: string, wishlistId?: string) => boolean;
  loadWishlists: () => Promise<void>;
  setCurrentWishlist: (id: string | null) => Promise<void>;
  createWishlist: (name: string, isPublic?: boolean) => Promise<Wishlist>;
  updateWishlist: (id: string, updates: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
  addToWishlist: (productId: string, wishlistId?: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  moveToCart: (itemIds: string[]) => Promise<void>;
  shareWishlist: (wishlistId?: string) => Promise<string>;
  exportWishlist: (format: 'csv' | 'pdf', options?: ExportOptions) => Promise<void>;
  setSelectedItems: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  clearError: () => void;
}

interface ExportOptions {
  includeImages?: boolean;
  includeDescriptions?: boolean;
  includePrices?: boolean;
  includeStockStatus?: boolean;
}

const WishlistContext = React.createContext<WishlistContextType | null>(null);

export const useWishlistContext = (): WishlistContextType => {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  // Store selectors (stable - no useCallback wrappers!)
  const wishlists = useWishlistStore((state) => state.wishlists);
  const currentWishlistId = useWishlistStore((state) => state.currentWishlistId);
  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const isInitializing = useWishlistStore((state) => state.isInitializing);
  const error = useWishlistStore((state) => state.error);
  const selectedItems = useWishlistStore((state) => state.selectedItems);
  
  // Store actions (stable references - direct selectors)
  const loadWishlists = useWishlistStore((state) => state.loadWishlists);
  const loadWishlistItems = useWishlistStore((state) => state.loadWishlistItems);
  const createWishlistAction = useWishlistStore((state) => state.createWishlist);
  const updateWishlistAction = useWishlistStore((state) => state.updateWishlist);
  const deleteWishlistAction = useWishlistStore((state) => state.deleteWishlist);
  const addToWishlistAction = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlistAction = useWishlistStore((state) => state.removeFromWishlist);
  const moveToCartAction = useWishlistStore((state) => state.moveToCart);
  const shareWishlistAction = useWishlistStore((state) => state.shareWishlist);
  const exportWishlistAction = useWishlistStore((state) => state.exportWishlist);
  const setSelectedItemsAction = useWishlistStore((state) => state.setSelectedItems);
  const toggleItemSelectionAction = useWishlistStore((state) => state.toggleItemSelection);
  const clearSelectionAction = useWishlistStore((state) => state.clearSelection);
  const selectAllAction = useWishlistStore((state) => state.selectAll);
  const setCurrentWishlistAction = useWishlistStore((state) => state.setCurrentWishlist);
  const clearErrorAction = useWishlistStore((state) => state.clearError);
  
  // Refs for deduplication
  const hasLoadedInitially = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Compute derived state
  const currentWishlist = wishlists.find((w) => w.id === currentWishlistId) || null;
  const defaultWishlist = wishlists.find((w) => w.isDefault) || null;
  const currentWishlistItems = items.filter((item) => item.wishlistId === currentWishlistId);
  
  const isInWishlist = useCallback(
    (productId: string, wishlistId?: string): boolean => {
      const targetId = wishlistId || currentWishlistId;
      if (!targetId) return false;
      return items.some(
        (item) => item.wishlistId === targetId && item.productId === productId
      );
    },
    [currentWishlistId, items]
  );
  
  // Load wishlists on mount (only once, with proper deduplication)
  useEffect(() => {
    if (isAuthenticated && !hasLoadedInitially.current) {
      hasLoadedInitially.current = true;
      loadWishlists().catch((err) => {
        console.error('[WishlistContext] Failed to load wishlists:', err);
        hasLoadedInitially.current = false;
      });
    }
    
    if (status === 'unauthenticated') {
      hasLoadedInitially.current = false;
    }
  }, [isAuthenticated, status, loadWishlists]);
  
  // Handle tab visibility changes (debounced)
  useEffect(() => {
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
  
  // Context value with wrapped actions
  const contextValue: WishlistContextType = {
    wishlists,
    currentWishlist,
    items,
    isLoading,
    isInitializing,
    error,
    selectedItems,
    defaultWishlist,
    currentWishlistItems,
    isInWishlist,
    
    loadWishlists: useCallback(async () => {
      await loadWishlists();
    }, [loadWishlists]),
    
    setCurrentWishlist: useCallback(async (id: string | null) => {
      setCurrentWishlistAction(id);
      if (id) {
        await loadWishlistItems(id);
      }
    }, [setCurrentWishlistAction, loadWishlistItems]),
    
    createWishlist: useCallback(
      async (name: string, isPublic: boolean = false) => {
        try {
          const result = await createWishlistAction({ name, isPublic, isDefault: false });
          toast.success('Wishlist created successfully');
          return result;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to create wishlist');
          throw error;
        }
      },
      [createWishlistAction]
    ),
    
    updateWishlist: useCallback(
      async (id: string, updates: Partial<Wishlist>) => {
        try {
          await updateWishlistAction(id, updates);
          toast.success('Wishlist updated successfully');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to update wishlist');
          throw error;
        }
      },
      [updateWishlistAction]
    ),
    
    deleteWishlist: useCallback(
      async (id: string) => {
        try {
          await deleteWishlistAction(id);
          toast.success('Wishlist deleted successfully');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to delete wishlist');
          throw error;
        }
      },
      [deleteWishlistAction]
    ),
    
    addToWishlist: useCallback(
      async (productId: string, wishlistId?: string) => {
        const targetId = wishlistId || defaultWishlist?.id;
        if (!targetId) {
          throw new Error('No wishlist specified and no default wishlist found');
        }
        
        try {
          await addToWishlistAction(targetId, productId);
          toast.success('Added to wishlist');
        } catch (error) {
          if (error instanceof Error && error.message.includes('already exists')) {
            toast.info('Already in wishlist');
          } else {
            toast.error(error instanceof Error ? error.message : 'Failed to add to wishlist');
          }
          throw error;
        }
      },
      [addToWishlistAction, defaultWishlist]
    ),
    
    removeFromWishlist: useCallback(
      async (itemId: string) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        
        try {
          await removeFromWishlistAction(item.wishlistId, itemId);
          toast.success('Removed from wishlist');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to remove from wishlist');
          throw error;
        }
      },
      [removeFromWishlistAction, items]
    ),
    
    moveToCart: useCallback(
      async (itemIds: string[]) => {
        if (!currentWishlistId) {
          throw new Error('No wishlist selected');
        }
        
        try {
          await moveToCartAction(currentWishlistId, itemIds);
          toast.success('Moved to cart successfully');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to move to cart');
          throw error;
        }
      },
      [moveToCartAction, currentWishlistId]
    ),
    
    shareWishlist: useCallback(
      async (wishlistId?: string) => {
        const targetId = wishlistId || currentWishlistId;
        if (!targetId) {
          throw new Error('No wishlist specified');
        }
        
        try {
          const response = await shareWishlistAction(targetId);
          toast.success('Share link copied to clipboard');
          return response.shareUrl;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to share wishlist');
          throw error;
        }
      },
      [shareWishlistAction, currentWishlistId]
    ),
    
    exportWishlist: useCallback(
      async (format: 'csv' | 'pdf', options?: ExportOptions) => {
        if (!currentWishlistId) {
          throw new Error('No wishlist selected');
        }
        
        try {
          const blob = await exportWishlistAction(currentWishlistId, format, options);
          
          // Trigger download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `wishlist-${currentWishlistId}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('Wishlist exported successfully');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to export wishlist');
          throw error;
        }
      },
      [exportWishlistAction, currentWishlistId]
    ),
    
    setSelectedItems: useCallback((itemIds: string[]) => {
      setSelectedItemsAction(itemIds);
    }, [setSelectedItemsAction]),
    
    toggleItemSelection: useCallback((itemId: string) => {
      toggleItemSelectionAction(itemId);
    }, [toggleItemSelectionAction]),
    
    clearSelection: useCallback(() => {
      clearSelectionAction();
    }, [clearSelectionAction]),
    
    selectAll: useCallback(() => {
      selectAllAction();
    }, [selectAllAction]),
    
    clearError: useCallback(() => {
      clearErrorAction();
    }, [clearErrorAction]),
  };
  
  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
```

---

## useWishlist Hook Design

```typescript
// frontend/src/hooks/useWishlist.ts

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
import type { UseWishlistReturn } from '@/types/wishlist';

/**
 * useWishlist Custom Hook
 * 
 * Provides a comprehensive interface for wishlist management with:
 * - Stable function references (NO useCallback wrappers on store actions)
 * - Proper useEffect dependencies using refs for deduplication
 * - Debounced visibility change handling
 * - Bilingual support ready
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
  
  // ========== ACTION SELECTORS (stable - direct store selectors) ==========
  // CRITICAL: Do NOT wrap these in useCallback!
  const loadWishlists = useWishlistStore((state) => state.loadWishlists);
  const loadWishlistItems = useWishlistStore((state) => state.loadWishlistItems);
  const createWishlist = useWishlistStore((state) => state.createWishlist);
  const updateWishlist = useWishlistStore((state) => state.updateWishlist);
  const deleteWishlist = useWishlistStore((state) => state.deleteWishlist);
  const setCurrentWishlist = useWishlistStore((state) => state.setCurrentWishlist);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const moveToCart = useWishlistStore((state) => state.moveToCart);
  const shareWishlist = useWishlistStore((state) => state.shareWishlist);
  const exportWishlist = useWishlistStore((state) => state.exportWishlist);
  const setSelectedItems = useWishlistStore((state) => state.setSelectedItems);
  const toggleItemSelection = useWishlistStore((state) => state.toggleItemSelection);
  const clearSelection = useWishlistStore((state) => state.clearSelection);
  const selectAll = useWishlistStore((state) => state.selectAll);
  const clearError = useWishlistStore((state) => state.clearError);
  
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
  
  // ========== EFFECT HOOKS (proper dependency management) ==========
  
  /**
   * Load wishlists on mount - using ref-based flag to prevent infinite loop
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
  }, [isAuthenticated, status]);
  
  /**
   * Handle tab visibility changes - debounced
   */
  useEffect(() => {
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
  }, [isAuthenticated]);
  
  // ========== WRAPPER ACTIONS ==========
  
  const createWishlistWithName = useCallback(
    async (name: string, isPublic: boolean = false) => {
      return createWishlist({ name, isPublic, isDefault: false });
    },
    [createWishlist]
  );
  
  const updateWishlistWithUpdates = useCallback(
    async (id: string, updates: any) => {
      await updateWishlist(id, updates);
    },
    [updateWishlist]
  );
  
  const setCurrentWishlistWithItems = useCallback(
    async (id: string | null) => {
      setCurrentWishlist(id);
      if (id) {
        await loadWishlistItems(id);
      }
    },
    [setCurrentWishlist, loadWishlistItems]
  );
  
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
    getWishlistItemCount: (id: string) =>
      items.filter((item) => item.wishlistId === id).length,
    defaultWishlist,
    loadWishlists,
    setCurrentWishlist: setCurrentWishlistWithItems,
    createWishlist: createWishlistWithName,
    updateWishlist: updateWishlistWithUpdates,
    deleteWishlist,
    addToWishlist,
    addToDefaultWishlist: async (productId: string) => {
      const target = defaultWishlist;
      if (!target) {
        const newWishlist = await createWishlistWithName('My Wishlist', false);
        await addToWishlist(newWishlist.id, productId);
      } else {
        await addToWishlist(target.id, productId);
      }
    },
    removeFromWishlist,
    moveToCart,
    shareWishlist,
    exportWishlist,
    setSelectedItems,
    toggleItemSelection,
    clearSelection,
    selectAll,
    clearError,
  };
}

export default useWishlist;
```

---

## Component Architecture

### WishlistPage Component

```typescript
// frontend/src/components/wishlist/WishlistPage.tsx

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistHeader } from './WishlistHeader';
import { WishlistToolbar } from './WishlistToolbar';
import { WishlistGrid } from './WishlistGrid';
import { WishlistEmptyState } from './WishlistEmptyState';
import { WishlistManagementModal } from './WishlistManagementModal';
import { WishlistShareModal } from './WishlistShareModal';
import { WishlistExportModal } from './WishlistExportModal';
import type { WishlistPageProps } from './types';

export const WishlistPage: React.FC<WishlistPageProps> = ({
  initialWishlistId,
  language = 'en',
}) => {
  const {
    wishlists,
    currentWishlist,
    currentWishlistItems,
    isLoading,
    error,
    selectedItems,
    loadWishlists,
    setCurrentWishlist,
    createWishlist,
    deleteWishlist,
    shareWishlist,
    exportWishlist,
    setSelectedItems,
    clearSelection,
    selectAll,
    clearError,
  } = useWishlist();
  
  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('addedAt-desc');
  const [filterBy, setFilterBy] = useState('all');
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  // Initialize wishlist
  useEffect(() => {
    loadWishlists();
  }, [loadWishlists]);
  
  useEffect(() => {
    if (initialWishlistId && wishlists.length > 0) {
      const exists = wishlists.find((w) => w.id === initialWishlistId);
      if (exists) {
        setCurrentWishlist(initialWishlistId);
      }
    }
  }, [initialWishlistId, wishlists, setCurrentWishlist]);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...currentWishlistItems];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.product.name.toLowerCase().includes(query) ||
          item.product.sku.toLowerCase().includes(query)
      );
    }
    
    if (filterBy === 'inStock') {
      items = items.filter((item) => item.product.stockQuantity > 0);
    } else if (filterBy === 'outOfStock') {
      items = items.filter((item) => item.product.stockQuantity === 0);
    }
    
    switch (sortBy) {
      case 'name-asc':
        items.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.product.name.localeCompare(a.product.name));
        break;
      case 'price-asc':
        items.sort((a, b) => a.product.regularPrice - b.product.regularPrice);
        break;
      case 'price-desc':
        items.sort((a, b) => b.product.regularPrice - a.product.regularPrice);
        break;
      default:
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
    
    return items;
  }, [currentWishlistItems, searchQuery, sortBy, filterBy]);
  
  const handleSelectWishlist = useCallback(
    async (id: string) => {
      await setCurrentWishlist(id);
      clearSelection();
    },
    [setCurrentWishlist, clearSelection]
  );
  
  const handleShareWishlist = useCallback(async () => {
    if (!currentWishlist) return;
    const url = await shareWishlist(currentWishlist.id);
    setShareUrl(url);
    setIsShareModalOpen(true);
  }, [currentWishlist, shareWishlist]);
  
  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.includes(item.id));
  
  return (
    <div className="wishlist-page">
      <WishlistHeader
        wishlists={wishlists}
        currentWishlist={currentWishlist}
        onSelectWishlist={handleSelectWishlist}
        onCreateWishlist={() => setIsManagementModalOpen(true)}
        onShareWishlist={handleShareWishlist}
        onExportWishlist={() => setIsExportModalOpen(true)}
        isLoading={isLoading}
      />
      
      {currentWishlist && (
        <WishlistToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
          selectedCount={selectedItems.length}
          onMoveSelectedToCart={() => {}}
          onRemoveSelected={() => {}}
          onSelectAll={selectAll}
          isAllSelected={isAllSelected}
          totalItems={currentWishlistItems.length}
        />
      )}
      
      {isLoading ? (
        <div className="wishlist-loading">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <WishlistEmptyState
          hasFilters={searchQuery !== '' || filterBy !== 'all'}
          onClearFilters={() => {
            setSearchQuery('');
            setFilterBy('all');
          }}
        />
      ) : (
        <WishlistGrid
          items={filteredItems}
          selectedItems={selectedItems}
          onSelectItem={(id) => {}}
          onRemoveItem={() => {}}
          onMoveToCart={() => {}}
          onViewProduct={(productId) => {
            window.location.href = `/products/${productId}`;
          }}
          isLoading={isLoading}
          language={language}
        />
      )}
      
      <WishlistManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        mode="create"
        onSuccess={(wishlist) => {
          createWishlist(wishlist.name, wishlist.isPublic);
        }}
      />
      
      <WishlistShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlist={currentWishlist!}
        shareUrl={shareUrl}
        onGenerateShare={handleShareWishlist}
        onCopyLink={() => {
          if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
          }
        }}
      />
      
      <WishlistExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wishlistId={currentWishlist?.id || ''}
        onExport={(format, options) => {
          if (currentWishlist) {
            exportWishlist(currentWishlist.id, format, options);
          }
        }}
      />
    </div>
  );
};

export default WishlistPage;
```

---

## API Integration Design

```typescript
// frontend/src/lib/api/wishlist.ts

import apiClient from './client';
import type {
  Wishlist,
  WishlistItemWithProduct,
  CreateWishlistRequest,
  UpdateWishlistRequest,
  GetWishlistsParams,
  ShareWishlistResponse,
} from '@/types/wishlist';

export const wishlistApi = {
  getWishlists: async (params?: GetWishlistsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.includeItems) queryParams.set('includeItems', 'true');
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    const endpoint = `/wishlist${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  },
  
  getWishlistById: async (id: string, shareToken?: string) => {
    const queryParams = new URLSearchParams();
    if (shareToken) queryParams.set('shareToken', shareToken);
    
    const endpoint = `/wishlist/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  },
  
  createWishlist: async (data: CreateWishlistRequest) => {
    return apiClient.post('/wishlist', data);
  },
  
  updateWishlist: async (id: string, data: UpdateWishlistRequest) => {
    return apiClient.put(`/wishlist/${id}`, data);
  },
  
  deleteWishlist: async (id: string) => {
    return apiClient.delete(`/wishlist/${id}`);
  },
  
  addItemToWishlist: async (wishlistId: string, productId: string) => {
    return apiClient.post(`/wishlist/${wishlistId}/items`, { productId });
  },
  
  removeItemFromWishlist: async (wishlistId: string, itemId: string) => {
    return apiClient.delete(`/wishlist/${wishlistId}/items/${itemId}`);
  },
  
  moveItemsToCart: async (wishlistId: string, itemIds: string[]) => {
    return apiClient.post(`/wishlist/${wishlistId}/items/move-to-cart`, { itemIds });
  },
  
  shareWishlist: async (wishlistId: string): Promise<ShareWishlistResponse> => {
    return apiClient.post(`/wishlist/${wishlistId}/share`, {});
  },
  
  exportWishlist: async (
    wishlistId: string,
    format: 'csv' | 'pdf',
    options?: Record<string, boolean>
  ): Promise<Blob> => {
    const queryParams = new URLSearchParams({ format });
    if (options?.includeImages) queryParams.set('includeImages', 'true');
    if (options?.includeDescriptions) queryParams.set('includeDescriptions', 'true');
    if (options?.includePrices) queryParams.set('includePrices', 'true');
    if (options?.includeStockStatus) queryParams.set('includeStockStatus', 'true');
    
    const endpoint = `/wishlist/${wishlistId}/export?${queryParams.toString()}`;
    return apiClient.get(endpoint, { unwrapResponse: false });
  },
};

export default wishlistApi;
```

---

## Cart Integration Design

```typescript
// Move to Cart Flow with Stock Validation

const handleMoveToCart = async (itemId: string) => {
  const item = items.find((i) => i.id === itemId);
  if (!item) return;
  
  // Check stock first
  if (item.product.stockQuantity === 0) {
    toast.error('This item is out of stock');
    return;
  }
  
  try {
    // Move from wishlist
    await moveToCart(currentWishlist!.id, [itemId]);
    
    // Add to cart context
    await addItem(item.product, 1, item.product.variantId, {
      onSuccess: () => {
        toast.success('Added to cart');
      },
    });
  } catch (error) {
    toast.error('Failed to move to cart');
  }
};
```

---

## File Structure

```
frontend/src/
├── components/
│   └── wishlist/
│       ├── index.ts
│       ├── types.ts
│       ├── WishlistPage.tsx
│       ├── WishlistHeader.tsx
│       ├── WishlistToolbar.tsx
│       ├── WishlistGrid.tsx
│       ├── WishlistItemCard.tsx
│       ├── WishlistEmptyState.tsx
│       ├── WishlistManagementModal.tsx
│       ├── WishlistShareModal.tsx
│       ├── WishlistExportModal.tsx
│       └── AddToWishlistButton.tsx
├── hooks/
│   └── useWishlist.ts
├── contexts/
│   └── WishlistContext.tsx
├── stores/
│   ├── wishlistStore.ts
│   └── wishlistStore.selectors.ts
├── lib/
│   └── api/
│       └── wishlist.ts
└── types/
    └── wishlist.ts
```

---

## Bilingual Support

```typescript
export const wishlistMessages = {
  en: {
    title: 'My Wishlist',
    emptyTitle: 'Your wishlist is empty',
    createWishlist: 'Create Wishlist',
    editWishlist: 'Edit Wishlist',
    deleteWishlist: 'Delete Wishlist',
    shareWishlist: 'Share Wishlist',
    exportWishlist: 'Export Wishlist',
    addToWishlist: 'Add to Wishlist',
    removeFromWishlist: 'Remove from Wishlist',
    moveToCart: 'Move to Cart',
    searchPlaceholder: 'Search items...',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    price: 'Price',
  },
  bn: {
    title: 'আমার ইচ্ছেতালিকা',
    emptyTitle: 'আপনার ইচ্ছেতালিকা খালি',
    createWishlist: 'ইচ্ছেতালিকা তৈরি করুন',
    editWishlist: 'ইচ্ছেতালিকা সম্পাদনা করুন',
    deleteWishlist: 'ইচ্ছেতালিকা মুছুন',
    shareWishlist: 'ইচ্ছেতালিকা শেয়ার করুন',
    exportWishlist: 'ইচ্ছেতালিকা রপ্তানি করুন',
    addToWishlist: 'ইচ্ছেতালিকায় যোগ করুন',
    removeFromWishlist: 'ইচ্ছেতালিকা থেকে সরান',
    moveToCart: 'কার্টে স্থানান্তর করুন',
    searchPlaceholder: 'আইটেম খুঁজুন...',
    outOfStock: 'স্টকে নেই',
    inStock: 'স্টকে আছে',
    price: 'মূল্য',
  },
};
```

---

## Summary of Key Fixes

| Issue | Solution |
|-------|----------|
| **Unstable function references** | Removed ALL `useCallback` wrappers from action selectors; use direct store selectors |
| **Infinite useEffect loops** | Removed `loadWishlists` from useEffect dependencies; use refs for tracking |
| **Cascading state updates** | Decoupled `setCurrentWishlist` from immediate item loading |
| **Inadequate deduplication** | Added `pendingRequests` Map for request deduplication in store |
| **Visibility change triggers** | Added debounced visibility change handler with 1-second delay |

This architecture provides a solid foundation for a performant, bug-free Wishlist implementation.
