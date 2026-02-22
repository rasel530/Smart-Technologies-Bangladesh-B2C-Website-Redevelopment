/**
 * Cart-Wishlist Integration Utility Functions
 *
 * Helper functions for cart-wishlist integration features
 * Following Phase 6 Milestone 3 specifications
 */

// ============================================================================
// Types
// ============================================================================

export interface SyncStatusInfo {
  label: string;
  color: string;
  icon: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: {
    id: string;
    name?: string;
  };
}

export interface WishlistItem {
  id: string;
  productId: string;
  wishlistId: string;
  product?: {
    id: string;
    name?: string;
  };
}

// ============================================================================
// Item Checking Functions
// ============================================================================

/**
 * Check if a product is in wishlist
 * @param productId - The product ID to check
 * @param wishlistItems - Array of wishlist items
 * @returns boolean
 */
export const checkItemInWishlist = (
  productId: string,
  wishlistItems: WishlistItem[]
): boolean => {
  if (!wishlistItems || wishlistItems.length === 0) {
    return false;
  }
  
  return wishlistItems.some((item) => item.productId === productId);
};

/**
 * Check if a product is in cart
 * @param productId - The product ID to check
 * @param cartItems - Array of cart items
 * @returns boolean
 */
export const checkItemInCart = (
  productId: string,
  cartItems: CartItem[]
): boolean => {
  if (!cartItems || cartItems.length === 0) {
    return false;
  }
  
  return cartItems.some((item) => item.productId === productId);
};

/**
 * Find wishlist item by product ID
 * @param productId - The product ID to find
 * @param wishlistItems - Array of wishlist items
 * @returns WishlistItem | null
 */
export const findWishlistItemByProduct = (
  productId: string,
  wishlistItems: WishlistItem[]
): WishlistItem | null => {
  if (!wishlistItems || wishlistItems.length === 0) {
    return null;
  }
  
  return wishlistItems.find((item) => item.productId === productId) || null;
};

/**
 * Find cart item by product ID
 * @param productId - The product ID to find
 * @param cartItems - Array of cart items
 * @returns CartItem | null
 */
export const findCartItemByProduct = (
  productId: string,
  cartItems: CartItem[]
): CartItem | null => {
  if (!cartItems || cartItems.length === 0) {
    return null;
  }
  
  return cartItems.find((item) => item.productId === productId) || null;
};

// ============================================================================
// Sync Status Functions
// ============================================================================

/**
 * Format sync status for display
 * @param status - The sync status string
 * @returns SyncStatusInfo
 */
export const formatSyncStatus = (status: string): SyncStatusInfo => {
  const statusMap: Record<string, SyncStatusInfo> = {
    pending: {
      label: 'Pending',
      color: 'yellow',
      icon: 'Clock',
    },
    syncing: {
      label: 'Syncing',
      color: 'blue',
      icon: 'RefreshCw',
    },
    completed: {
      label: 'Completed',
      color: 'green',
      icon: 'CheckCircle',
    },
    failed: {
      label: 'Failed',
      color: 'red',
      icon: 'XCircle',
    },
  };
  
  return statusMap[status] || statusMap.pending;
};

/**
 * Calculate sync progress percentage
 * @param pending - Number of pending operations
 * @param total - Total number of operations
 * @returns number (0-100)
 */
export const calculateSyncProgress = (
  pending: number,
  total: number
): number => {
  if (total === 0) {
    return 100;
  }
  
  const completed = total - pending;
  const progress = (completed / total) * 100;
  
  return Math.min(100, Math.max(0, Math.round(progress)));
};

/**
 * Format last sync time
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string
 */
export const formatLastSyncTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// ============================================================================
// Conflict Functions
// ============================================================================

/**
 * Generate a unique conflict ID
 * @returns string
 */
export const generateConflictId = (): string => {
  return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Format conflict type for display
 * @param type - The conflict type
 * @returns Formatted type string
 */
export const formatConflictType = (type: string): string => {
  const typeMap: Record<string, string> = {
    quantity_mismatch: 'Quantity Mismatch',
    price_mismatch: 'Price Mismatch',
    variant_mismatch: 'Variant Mismatch',
    duplicate_item: 'Duplicate Item',
    stock_conflict: 'Stock Conflict',
  };
  
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );
};

// ============================================================================
// Offline Queue Functions
// ============================================================================

/**
 * Generate a unique operation ID
 * @returns string
 */
export const generateOperationId = (): string => {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Check if offline queue has operations
 * @returns boolean
 */
export const hasPendingOfflineOperations = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const queue = localStorage.getItem('cartWishlistOfflineQueue');
    if (!queue) {
      return false;
    }
    
    const parsedQueue = JSON.parse(queue);
    return Array.isArray(parsedQueue) && parsedQueue.length > 0;
  } catch (error) {
    console.error('[CartWishlistUtils] Error checking offline queue:', error);
    return false;
  }
};

/**
 * Get offline queue count
 * @returns number
 */
export const getOfflineQueueCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  
  try {
    const queue = localStorage.getItem('cartWishlistOfflineQueue');
    if (!queue) {
      return 0;
    }
    
    const parsedQueue = JSON.parse(queue);
    return Array.isArray(parsedQueue) ? parsedQueue.length : 0;
  } catch (error) {
    console.error('[CartWishlistUtils] Error getting offline queue count:', error);
    return 0;
  }
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate cart item data
 * @param item - The cart item to validate
 * @returns { valid: boolean; errors: string[] }
 */
export const validateCartItem = (
  item: Partial<CartItem>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.productId) {
    errors.push('Product ID is required');
  }
  
  if (!item.quantity || item.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }
  
  if (item.quantity && item.quantity > 99) {
    errors.push('Quantity cannot exceed 99');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate wishlist item data
 * @param item - The wishlist item to validate
 * @returns { valid: boolean; errors: string[] }
 */
export const validateWishlistItem = (
  item: Partial<WishlistItem>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.productId) {
    errors.push('Product ID is required');
  }
  
  if (!item.wishlistId) {
    errors.push('Wishlist ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Analytics Helper Functions
// ============================================================================

/**
 * Calculate conversion rate percentage
 * @param converted - Number of converted items
 * @param total - Total number of items
 * @returns number (0-100)
 */
export const calculateConversionRate = (
  converted: number,
  total: number
): number => {
  if (total === 0) {
    return 0;
  }
  
  return Math.round((converted / total) * 100);
};

/**
 * Format average time duration
 * @param minutes - Average time in minutes
 * @returns Formatted time string
 */
export const formatAverageTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.round((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
};

/**
 * Format currency value
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: ৳)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = '৳'
): string => {
  return `${currency}${amount.toFixed(2)}`;
};

// ============================================================================
// Network Status Functions
// ============================================================================

/**
 * Check if browser is online
 * @returns boolean
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  
  return navigator.onLine;
};

/**
 * Get network status label
 * @param online - Whether online or not
 * @returns Status label string
 */
export const getNetworkStatusLabel = (online: boolean): string => {
  return online ? 'Online' : 'Offline';
};

/**
 * Get network status color
 * @param online - Whether online or not
 * @returns Color class string
 */
export const getNetworkStatusColor = (online: boolean): string => {
  return online ? 'text-green-600' : 'text-red-600';
};

// ============================================================================
// Selection Helper Functions
// ============================================================================

/**
 * Get all selected item IDs
 * @param items - Array of items with selection state
 * @returns Array of selected item IDs
 */
export const getSelectedIds = <T extends { id: string; selected?: boolean }>(
  items: T[]
): string[] => {
  return items.filter((item) => item.selected).map((item) => item.id);
};

/**
 * Check if all items are selected
 * @param items - Array of items with selection state
 * @returns boolean
 */
export const areAllSelected = <T extends { selected?: boolean }>(
  items: T[]
): boolean => {
  if (items.length === 0) {
    return false;
  }
  
  return items.every((item) => item.selected);
};

/**
 * Check if any items are selected
 * @param items - Array of items with selection state
 * @returns boolean
 */
export const hasSelectedItems = <T extends { selected?: boolean }>(
  items: T[]
): boolean => {
  return items.some((item) => item.selected);
};

// ============================================================================
// Export
// ============================================================================

export default {
  // Item Checking
  checkItemInWishlist,
  checkItemInCart,
  findWishlistItemByProduct,
  findCartItemByProduct,
  
  // Sync Status
  formatSyncStatus,
  calculateSyncProgress,
  formatLastSyncTime,
  
  // Conflict
  generateConflictId,
  formatConflictType,
  
  // Offline Queue
  generateOperationId,
  hasPendingOfflineOperations,
  getOfflineQueueCount,
  
  // Validation
  validateCartItem,
  validateWishlistItem,
  
  // Analytics
  calculateConversionRate,
  formatAverageTime,
  formatCurrency,
  
  // Network Status
  isOnline,
  getNetworkStatusLabel,
  getNetworkStatusColor,
  
  // Selection
  getSelectedIds,
  areAllSelected,
  hasSelectedItems,
};
