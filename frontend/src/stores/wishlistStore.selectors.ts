/**
 * Wishlist Store Selectors
 *
 * Stable selectors for wishlist state slices
 */

import { useWishlistStore } from './wishlistStore';
import type { Wishlist, WishlistItemWithProduct } from '@/types/wishlist';

// Re-export shallow from zustand
export { shallow } from 'zustand/shallow';

/**
 * Select all wishlists
 */
export const useWishlists = () => 
  useWishlistStore((state) => state.wishlists);

/**
 * Select current wishlist
 */
export const useCurrentWishlist = () => {
  const currentWishlistId = useWishlistStore((state) => state.currentWishlistId);
  const wishlists = useWishlistStore((state) => state.wishlists);
  return wishlists.find((w) => w.id === currentWishlistId) || null;
};

/**
 * Select wishlist items
 */
export const useWishlistItems = () => 
  useWishlistStore((state) => state.items);

/**
 * Select current wishlist items (filtered by currentWishlistId)
 */
export const useCurrentWishlistItems = () => {
  const currentWishlistId = useWishlistStore((state) => state.currentWishlistId);
  const items = useWishlistStore((state) => state.items);
  return items.filter((item) => item.wishlistId === currentWishlistId);
};

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
export const useDefaultWishlist = () => {
  const wishlists = useWishlistStore((state) => state.wishlists);
  return wishlists.find((w) => w.isDefault) || null;
};
