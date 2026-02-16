'use client';

/**
 * Category Page Client Component
 *
 * FIXES INCLUDED:
 * - Prevent infinite rerender loop from useSearchParams
 * - Stable dependency handling
 * - Hydration-safe localStorage usage
 * - Prevent redundant router updates
 * - Cleaner logic (removed refs & extra state)
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ViewToggle, ViewMode } from '@/components/product/ViewToggle';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface CategoryPageClientProps {
  categoryId: string;
  initialProducts: any[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  categories: Category[];
  brands: Brand[];
  initialPage: number;
  initialLimit: number;
  initialSortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity';
  initialSortOrder?: 'asc' | 'desc';
  initialBrand?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialRating?: number;
}

export function CategoryPageClient({
  categoryId,
  initialProducts,
  initialPagination,
  categories,
  brands,
  initialPage,
  initialLimit,
}: CategoryPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Wishlist
  const { isInWishlist, addToDefaultWishlist, removeFromWishlist, items } =
    useWishlist();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMounted, setIsMounted] = useState(false);

  // IMPORTANT: Extract primitive value (stable dependency)
  const viewParam = searchParams.get('view');

  /**
   * Mark mounted to safely use localStorage
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Sync view mode from:
   * 1. URL param
   * 2. localStorage fallback
   *
   * FIXED: depends only on primitive value
   */
  useEffect(() => {
    if (!isMounted) return;

    let next: ViewMode = 'grid';

    if (viewParam === 'grid' || viewParam === 'list') {
      next = viewParam;
    } else {
      const saved = localStorage.getItem(
        'smart_tech_product_view_mode'
      ) as ViewMode;

      if (saved === 'grid' || saved === 'list') {
        next = saved;
      }
    }

    if (next !== viewMode) {
      setViewMode(next);
    }
  }, [viewParam, isMounted]); // ✅ stable deps only

  /**
   * Wishlist Set Memo
   */
  const wishlistedProducts = useMemo(() => {
    return new Set(
      items
        .filter((i) => initialProducts.some((p) => p.id === i.productId))
        .map((i) => i.productId)
    );
  }, [initialProducts, items]);

  /**
   * Handle view mode change
   */
  const handleViewChange = (mode: ViewMode) => {
    // Prevent redundant updates
    if (mode === viewMode) return;

    setViewMode(mode);

    localStorage.setItem('smart_tech_product_view_mode', mode);

    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);

    // IMPORTANT: replace prevents rerender loop/history spam
    router.replace(`?${params.toString()}`);
  };

  /**
   * Toggle wishlist
   */
  const handleToggleWishlist = async (productId: string) => {
    try {
      if (isInWishlist(productId)) {
        const item = items.find((i) => i.productId === productId);
        if (item) {
          await removeFromWishlist(item.wishlistId, item.id);
          toast.success('Item removed from wishlist');
        }
      } else {
        await addToDefaultWishlist(productId);
        toast.success('Item added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar categories={categories} brands={brands} />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              {initialPagination.total > 0
                ? `Showing ${
                    (initialPage - 1) * initialLimit + 1
                  }-${Math.min(
                    initialPage * initialLimit,
                    initialPagination.total
                  )} of ${initialPagination.total} products`
                : 'No products found'}
            </p>

            <div className="flex items-center gap-3">
              {/* Mobile Filters */}
              <button className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:border-gray-400">
                Filters
              </button>

              {/* View Toggle */}
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={handleViewChange}
              />

              {/* Sort */}
              <SortDropdown />
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={initialProducts}
            columns={{
              mobile: 1,
              tablet: 2,
              desktop: viewMode === 'grid' ? 3 : 1,
            }}
            viewMode={viewMode}
            onToggleWishlist={handleToggleWishlist}
            wishlistedProducts={wishlistedProducts}
          />
        </main>
      </div>
    </div>
  );
}
