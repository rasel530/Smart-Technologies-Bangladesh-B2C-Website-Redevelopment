/**
 * Category Products Component
 * 
 * This component fetches products independently and is wrapped in Suspense.
 * This allows the category page to render the LCP image immediately
 * while products are loading in the background.
 */

import { getCategoryProductsServer } from '@/lib/api/server';
import { CategoryPageClient } from './CategoryPageClient';

interface CategoryProductsProps {
  categoryId: string;
  page: number;
  limit: number;
  sortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
}

export default async function CategoryProducts({
  categoryId,
  page,
  limit,
  sortBy,
  sortOrder,
  brand,
  minPrice,
  maxPrice,
  rating,
  categories,
  brands,
}: CategoryProductsProps) {
  // Fetch products independently
  const productsData = await getCategoryProductsServer(categoryId, {
    page,
    limit,
    sortBy,
    sortOrder,
    brandId: brand,
    minPrice,
    maxPrice,
    visibility: 'public',
  });

  return (
    <CategoryPageClient
      categoryId={categoryId}
      initialProducts={productsData.products}
      initialPagination={productsData.pagination}
      categories={categories}
      brands={brands}
      initialPage={page}
      initialLimit={limit}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
      initialBrand={brand}
      initialMinPrice={minPrice}
      initialMaxPrice={maxPrice}
      initialRating={rating}
    />
  );
}
