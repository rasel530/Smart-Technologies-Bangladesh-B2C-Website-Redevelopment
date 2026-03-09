'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryDetailResponse, CategoryProductsResponse } from '@/types/category';
import { getCategoryBySlug, getCategoryProducts } from '@/lib/api/categories';
import { CategoryBreadcrumb } from './CategoryBreadcrumb';
import { CategoryFilter } from './CategoryFilter';
import { CategorySort } from './CategorySort';
import { getImageUrl } from '@/lib/utils/image';

interface CategoryPageProps {
  slug: string;
}

/**
 * CategoryPage Component
 * 
 * Category page layout with description, image, and product grid
 */
export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryDetailResponse | null>(null);
  const [productsData, setProductsData] = useState<CategoryProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Filter and sort state
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
  }>({});
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'createdAt' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCategoryBySlug(slug);
        setCategory(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load category');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;

      try {
        setIsLoadingProducts(true);
        const params: any = {
          page: currentPage,
          limit: 20,
          sortBy,
          sortOrder
        };

        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;

        const data = await getCategoryProducts(category.category.id, params);
        setProductsData(data);
      } catch (err: any) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [category, currentPage, filters, sortBy, sortOrder]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Category
          </h1>
          <p className="text-red-600">{error || 'Category not found'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <CategoryBreadcrumb categories={category.path} />
      </div>

      {/* Category Header */}
      <div className="mb-8">
        {category.category.imageUrl && (
          <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
            <img
              src={getImageUrl(category.category.imageUrl) || ''}
              alt={category.category.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {category.category.name}
              </h1>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h1 className={`text-3xl font-bold text-gray-900 mb-4 ${!category.category.imageUrl ? '' : ''}`}>
            {category.category.name}
          </h1>

          {category.category.description && (
            <p className="text-gray-600 leading-relaxed">
              {category.category.description}
            </p>
          )}
        </div>

        {/* Subcategories */}
        {category.category.children && category.category.children.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subcategories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.category.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/categories/${child.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/categories/${child.slug}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${child.name} category`}
                >
                  {child.iconUrl && (
                    <img
                      src={getImageUrl(child.iconUrl) || ''}
                      alt={child.name}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {child.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <CategoryFilter
          category={category.category}
          onFilterChange={handleFilterChange}
        />
        <CategorySort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Products Grid */}
      {isLoadingProducts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ) : productsData && productsData.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {productsData.products.map((product: any) => (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/products/${product.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/products/${product.slug}`);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${product.name} product details`}
              >
                <div className="relative aspect-square">
                  {product.images?.[0]?.originalUrl && !imageErrors.has(product.id) ? (
                    <img
                      src={getImageUrl(product.images[0]?.originalUrl) || ''}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(product.id));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-red-600">
                            ৳{product.salePrice}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ৳{product.regularPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ৳{product.regularPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {productsData.pagination && productsData.pagination.pages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {[...Array(productsData.pagination.pages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === productsData.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.293.707V16l2 2a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1H8a1 1 0 00-1 1v-6z"
            />
          </svg>
          <p className="text-gray-600 text-lg">No products found in this category.</p>
          <p className="text-gray-500 mt-2">
            Try adjusting your filters or browse other categories.
          </p>
        </div>
      )}
    </div>
  );
};
