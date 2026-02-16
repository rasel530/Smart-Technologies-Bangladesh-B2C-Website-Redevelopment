/**
 * Wishlist Types
 * 
 * Complete type definitions for the Wishlist feature
 * following Milestone 2 specifications
 */

/**
 * Wishlist entity
 */
export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  shareToken?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wishlist item with product details
 */
export interface WishlistItemWithProduct {
  id: string;
  wishlistId: string;
  productId: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    slug: string;
    description?: string;
    regularPrice: number;
    salePrice?: number;
    discountPrice?: number;
    stockQuantity: number;
    images: ProductImage[];
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    brand?: {
      id: string;
      name: string;
      slug: string;
    };
    variantId?: string;
    variantName?: string;
  };
}

/**
 * Product image
 */
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

/**
 * Create wishlist request
 */
export interface CreateWishlistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

/**
 * Update wishlist request
 */
export interface UpdateWishlistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

/**
 * Get wishlists query parameters
 */
export interface GetWishlistsParams {
  includeItems?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Share wishlist response
 */
export interface ShareWishlistResponse {
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
}

/**
 * Move to cart response
 */
export interface MoveToCartResponse {
  success: boolean;
  movedItems: string[];
  failedItems: Array<{
    itemId: string;
    reason: string;
  }>;
  cartItemCount: number;
}

/**
 * Export options
 */
export interface ExportOptions {
  includeImages?: boolean;
  includeDescriptions?: boolean;
  includePrices?: boolean;
  includeStockStatus?: boolean;
}

/**
 * UseWishlist hook return type
 */
export interface UseWishlistReturn {
  // State
  wishlists: Wishlist[];
  currentWishlist: Wishlist | null;
  items: WishlistItemWithProduct[];
  currentWishlistItems: WishlistItemWithProduct[];
  isLoading: boolean;
  error: string | null;
  selectedItems: string[];
  defaultWishlist: Wishlist | null;
  isInWishlist: (productId: string, wishlistId?: string) => boolean;
  getWishlistItemCount: (id: string) => number;

  // Actions
  loadWishlists: () => Promise<void>;
  setCurrentWishlist: (id: string | null) => Promise<void>;
  createWishlist: (name: string, isPublic?: boolean) => Promise<Wishlist>;
  updateWishlist: (id: string, updates: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
  addToWishlist: (wishlistId: string, productId: string) => Promise<void>;
  addToDefaultWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (wishlistId: string, itemId: string) => Promise<void>;
  moveToCart: (wishlistId: string, itemIds: string[]) => Promise<MoveToCartResponse>;
  shareWishlist: (wishlistId: string) => Promise<ShareWishlistResponse>;
  exportWishlist: (wishlistId: string, format: 'csv' | 'pdf', options?: ExportOptions) => Promise<Blob>;
  setSelectedItems: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  clearError: () => void;
}

/**
 * Wishlist page props
 */
export interface WishlistPageProps {
  initialWishlistId?: string;
  language?: 'en' | 'bn';
}

/**
 * Wishlist header props
 */
export interface WishlistHeaderProps {
  wishlists: Wishlist[];
  currentWishlist: Wishlist | null;
  onSelectWishlist: (id: string) => Promise<void>;
  onCreateWishlist: () => void;
  onShareWishlist: () => Promise<void>;
  onExportWishlist: () => void;
  isLoading: boolean;
  language?: 'en' | 'bn';
}

/**
 * Wishlist toolbar props
 */
export interface WishlistToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  filterBy: string;
  onFilterChange: (filter: string) => void;
  selectedCount: number;
  onMoveSelectedToCart: () => Promise<void>;
  onRemoveSelected: () => Promise<void>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isAllSelected: boolean;
  totalItems: number;
  isBulkMoving?: boolean;
  isBulkRemoving?: boolean;
  language?: 'en' | 'bn';
}

/**
 * Wishlist grid props
 */
export interface WishlistGridProps {
  items: WishlistItemWithProduct[];
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => Promise<void>;
  onMoveToCart: (itemId: string) => Promise<void>;
  onViewProduct: (productId: string) => void;
  isLoading: boolean;
  language?: 'en' | 'bn';
}

/**
 * Wishlist item card props
 */
export interface WishlistItemCardProps {
  item: WishlistItemWithProduct;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => Promise<void>;
  onMoveToCart: () => Promise<void>;
  onViewProduct: () => void;
  language?: 'en' | 'bn';
}

/**
 * Wishlist empty state props
 */
export interface WishlistEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  language?: 'en' | 'bn';
}

/**
 * Wishlist management modal props
 */
export interface WishlistManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  wishlist?: Wishlist;
  onSuccess: (wishlistData: CreateWishlistRequest) => void;
  language?: 'en' | 'bn';
}

/**
 * Wishlist share modal props
 */
export interface WishlistShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Wishlist;
  shareUrl: string | null;
  onGenerateShare: () => Promise<void>;
  onCopyLink: () => void;
  language?: 'en' | 'bn';
}

/**
 * Wishlist export modal props
 */
export interface WishlistExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  onExport: (format: 'csv' | 'pdf', options?: ExportOptions) => Promise<void>;
  language?: 'en' | 'bn';
}

/**
 * Add to wishlist button props
 */
export interface AddToWishlistButtonProps {
  productId: string;
  wishlistId?: string;
  variant?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  };
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Bilingual messages for wishlist
 */
export const wishlistMessages = {
  en: {
    title: 'My Wishlist',
    emptyTitle: 'Your wishlist is empty',
    emptyDescription: 'Start adding items you love to your wishlist',
    emptyWithFilters: 'No items match your filters',
    clearFilters: 'Clear Filters',
    createWishlist: 'Create Wishlist',
    editWishlist: 'Edit Wishlist',
    deleteWishlist: 'Delete Wishlist',
    shareWishlist: 'Share Wishlist',
    exportWishlist: 'Export Wishlist',
    addToWishlist: 'Add to Wishlist',
    removeFromWishlist: 'Remove from Wishlist',
    moveToCart: 'Move to Cart',
    searchPlaceholder: 'Search items...',
    sortBy: 'Sort by',
    filterBy: 'Filter by',
    allItems: 'All Items',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    price: 'Price',
    addedDate: 'Added Date',
    name: 'Name',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    moveSelectedToCart: 'Move Selected to Cart',
    removeSelected: 'Remove Selected',
    itemsSelected: 'items selected',
    itemSelected: 'item selected',
    success: {
      created: 'Wishlist created successfully',
      updated: 'Wishlist updated successfully',
      deleted: 'Wishlist deleted successfully',
      added: 'Added to wishlist',
      removed: 'Removed from wishlist',
      movedToCart: 'Moved to cart successfully',
      shared: 'Share link copied to clipboard',
      exported: 'Wishlist exported successfully',
    },
    error: {
      create: 'Failed to create wishlist',
      update: 'Failed to update wishlist',
      delete: 'Failed to delete wishlist',
      add: 'Failed to add to wishlist',
      remove: 'Failed to remove from wishlist',
      moveToCart: 'Failed to move to cart',
      share: 'Failed to share wishlist',
      export: 'Failed to export wishlist',
      load: 'Failed to load wishlists',
      alreadyInWishlist: 'Already in wishlist',
      noWishlist: 'No wishlist specified',
      outOfStock: 'This item is out of stock',
    },
    info: {
      alreadyInWishlist: 'Already in wishlist',
    },
  },
  bn: {
    title: 'আমার ইচ্ছেতালিকা',
    emptyTitle: 'আপনার ইচ্ছেতালিকা খালি',
    emptyDescription: 'আপনার পছন্দের আইটেমগুলি ইচ্ছেতালিকায় যোগ করা শুরু করুন',
    emptyWithFilters: 'কোন আইটেম আপনার ফিল্টারের সাথে মেলে না',
    clearFilters: 'ফিল্টার সাফ করুন',
    createWishlist: 'ইচ্ছেতালিকা তৈরি করুন',
    editWishlist: 'ইচ্ছেতালিকা সম্পাদনা করুন',
    deleteWishlist: 'ইচ্ছেতালিকা মুছুন',
    shareWishlist: 'ইচ্ছেতালিকা শেয়ার করুন',
    exportWishlist: 'ইচ্ছেতালিকা রপ্তানি করুন',
    addToWishlist: 'ইচ্ছেতালিকায় যোগ করুন',
    removeFromWishlist: 'ইচ্ছেতালিকা থেকে সরান',
    moveToCart: 'কার্টে স্থানান্তর করুন',
    searchPlaceholder: 'আইটেম খুঁজুন...',
    sortBy: 'সাজান',
    filterBy: 'ফিল্টার',
    allItems: 'সব আইটেম',
    inStock: 'স্টকে আছে',
    outOfStock: 'স্টকে নেই',
    price: 'মূল্য',
    addedDate: 'যোগ করার তারিখ',
    name: 'নাম',
    selectAll: 'সব নির্বাচন করুন',
    deselectAll: 'সব নির্বাচন বাতিল করুন',
    moveSelectedToCart: 'নির্বাচিতগুলি কার্টে স্থানান্তর করুন',
    removeSelected: 'নির্বাচিতগুলি সরান',
    itemsSelected: 'আইটেম নির্বাচিত',
    itemSelected: 'আইটেম নির্বাচিত',
    success: {
      created: 'ইচ্ছেতালিকা সফলভাবে তৈরি হয়েছে',
      updated: 'ইচ্ছেতালিকা সফলভাবে আপডেট হয়েছে',
      deleted: 'ইচ্ছেতালিকা সফলভাবে মুছে ফেলা হয়েছে',
      added: 'ইচ্ছেতালিকায় যোগ করা হয়েছে',
      removed: 'ইচ্ছেতালিকা থেকে সরানো হয়েছে',
      movedToCart: 'কার্টে সফলভাবে স্থানান্তর করা হয়েছে',
      shared: 'শেয়ার লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে',
      exported: 'ইচ্ছেতালিকা সফলভাবে রপ্তানি করা হয়েছে',
    },
    error: {
      create: 'ইচ্ছেতালিকা তৈরি করতে ব্যর্থ হয়েছে',
      update: 'ইচ্ছেতালিকা আপডেট করতে ব্যর্থ হয়েছে',
      delete: 'ইচ্ছেতালিকা মুছতে ব্যর্থ হয়েছে',
      add: 'ইচ্ছেতালিকায় যোগ করতে ব্যর্থ হয়েছে',
      remove: 'ইচ্ছেতালিকা থেকে সরাতে ব্যর্থ হয়েছে',
      moveToCart: 'কার্টে স্থানান্তর করতে ব্যর্থ হয়েছে',
      share: 'ইচ্ছেতালিকা শেয়ার করতে ব্যর্থ হয়েছে',
      export: 'ইচ্ছেতালিকা রপ্তানি করতে ব্যর্থ হয়েছে',
      load: 'ইচ্ছেতালিকা লোড করতে ব্যর্থ হয়েছে',
      alreadyInWishlist: 'ইতিমধ্যে ইচ্ছেতালিকায় আছে',
      noWishlist: 'কোন ইচ্ছেতালিকা নির্দিষ্ট করা হয়নি',
      outOfStock: 'এই আইটেমটি স্টকে নেই',
    },
    info: {
      alreadyInWishlist: 'ইতিমধ্যে ইচ্ছেতালিকায় আছে',
    },
  },
};
