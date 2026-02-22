/**
 * Wishlist React Context
 *
 * Context provider for wishlist state management
 * Following WISHLIST_ARCHITECTURE_DESIGN.md
 */

'use client';

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useWishlistStore } from '@/stores/wishlistStore';
import type { Wishlist, WishlistItemWithProduct, AddToWishlistResult } from '@/types/wishlist';
import { wishlistMessages } from '@/types/wishlist';

interface WishlistProviderProps {
  children: ReactNode;
}

interface ExportOptions {
  includeImages?: boolean;
  includeDescriptions?: boolean;
  includePrices?: boolean;
  includeStockStatus?: boolean;
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
  isPrivateWishlistError: boolean;
  privateWishlistId: string | null;
  isInWishlist: (productId: string, wishlistId?: string) => boolean;
  loadWishlists: () => Promise<void>;
  setCurrentWishlist: (id: string | null) => Promise<void>;
  createWishlist: (name: string, isPublic?: boolean) => Promise<Wishlist>;
  updateWishlist: (id: string, updates: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
  addToWishlist: (productId: string, wishlistId?: string) => Promise<AddToWishlistResult>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  moveToCart: (itemIds: string[]) => Promise<void>;
  shareWishlist: (wishlistId?: string) => Promise<string>;
  exportWishlist: (format: 'csv' | 'pdf', options?: ExportOptions) => Promise<void>;
  setSelectedItems: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  clearError: () => void;
  makeWishlistPublic: (wishlistId: string) => Promise<void>;
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
  const isPrivateWishlistError = useWishlistStore((state) => state.isPrivateWishlistError);
  const privateWishlistId = useWishlistStore((state) => state.privateWishlistId);
  
  // Store actions (stable references - using getState() pattern to avoid render-time selector calls)
  const loadWishlists = useCallback(async () => {
    return useWishlistStore.getState().loadWishlists();
  }, []);
  
  const loadWishlistItems = useCallback(async (wishlistId: string) => {
    return useWishlistStore.getState().loadWishlistItems(wishlistId);
  }, []);
  
  const createWishlistAction = useCallback(async (data: { name: string; isPublic: boolean; isDefault: boolean }) => {
    return useWishlistStore.getState().createWishlist(data);
  }, []);
  
  const updateWishlistAction = useCallback(async (id: string, updates: Partial<Wishlist>) => {
    return useWishlistStore.getState().updateWishlist(id, updates);
  }, []);
  
  const deleteWishlistAction = useCallback(async (id: string) => {
    return useWishlistStore.getState().deleteWishlist(id);
  }, []);
  
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
  
  const makeWishlistPublicAction = useCallback(async (wishlistId: string) => {
    return useWishlistStore.getState().makeWishlistPublic(wishlistId);
  }, []);
  
  const setCurrentWishlistAction = useCallback(async (id: string | null) => {
    useWishlistStore.getState().setCurrentWishlist(id);
    if (id) {
      await loadWishlistItems(id);
    }
  }, [loadWishlistItems]);
  
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
  }, [isAuthenticated, status]);
  
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
  }, [isAuthenticated]);
  
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
    isPrivateWishlistError,
    privateWishlistId,
    isInWishlist,
    
    loadWishlists,
    
    setCurrentWishlist: setCurrentWishlistAction,
    
    createWishlist: useCallback(
      async (name: string, isPublic: boolean = false) => {
        try {
          const result = await createWishlistAction({ name, isPublic, isDefault: false });
          toast.success(wishlistMessages.en.success.created);
          return result;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.create);
          throw error;
        }
      },
      [createWishlistAction]
    ),
    
    updateWishlist: useCallback(
      async (id: string, updates: Partial<Wishlist>) => {
        try {
          await updateWishlistAction(id, updates);
          toast.success(wishlistMessages.en.success.updated);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.update);
          throw error;
        }
      },
      [updateWishlistAction]
    ),
    
    deleteWishlist: useCallback(
      async (id: string) => {
        try {
          await deleteWishlistAction(id);
          toast.success(wishlistMessages.en.success.deleted);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.delete);
          throw error;
        }
      },
      [deleteWishlistAction]
    ),
    
    addToWishlist: useCallback(
      async (productId: string, wishlistId?: string): Promise<AddToWishlistResult> => {
        const targetId = wishlistId || defaultWishlist?.id;
        if (!targetId) {
          const result: AddToWishlistResult = {
            success: false,
            message: wishlistMessages.en.error.noWishlist,
          };
          return result;
        }
        
        const result = await addToWishlistAction(targetId, productId);
        
        // Handle the result - show appropriate toast
        if (result.success) {
          toast.success(wishlistMessages.en.success.added);
        } else if (result.alreadyExists) {
          toast.info(wishlistMessages.en.info.alreadyInWishlist);
        }
        
        return result;
      },
      [addToWishlistAction, defaultWishlist]
    ),
    
    removeFromWishlist: useCallback(
      async (itemId: string) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        
        try {
          await removeFromWishlistAction(item.wishlistId, itemId);
          toast.success(wishlistMessages.en.success.removed);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.remove);
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
          toast.success(wishlistMessages.en.success.movedToCart);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.moveToCart);
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
          toast.success(wishlistMessages.en.success.shared);
          return response.shareUrl;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.share);
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
          
          toast.success(wishlistMessages.en.success.exported);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : wishlistMessages.en.error.export);
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
    
    makeWishlistPublic: useCallback(
      async (wishlistId: string) => {
        try {
          await makeWishlistPublicAction(wishlistId);
          toast.success('Wishlist is now public');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to make wishlist public');
          throw error;
        }
      },
      [makeWishlistPublicAction]
    ),
  };
  
  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
