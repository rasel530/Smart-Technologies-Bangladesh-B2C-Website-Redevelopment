'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandWithRelations, BrandProductFilter } from '@/types/brand';
import brandsApi from '@/lib/api/brands';
import ProductCard from '../product/ProductCard';
import { getImageUrl } from '@/lib/utils/image';

interface BrandDetailProps {
  brand: BrandWithRelations;
  initialProducts?: any[];
}

/**
 * BrandDetail Component
 * 
 * Displays a brand detail page layout with:
 * - Brand logo and description
 * - Brand contact information
 * - Brand website link
 * - Product grid
 * - Sorting and filtering
 */
export default function BrandDetail({ brand, initialProducts }: BrandDetailProps) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!initialProducts) {
      fetchBrandProducts();
    }
  }, [sortBy, sortOrder, currentPage]);

  const fetchBrandProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: BrandProductFilter = {
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      };

      const response = await brandsApi.getBrandProducts(brand.id, params);
      setProducts(response.products);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching brand products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Brand Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Brand Logo */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
            {brand.logoUrl ? (
              <Image
                src={getImageUrl(brand.logoUrl) || ''}
                alt={brand.name}
                width={300}
                height={300}
                className="max-w-full max-h-[300px] object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-lg">
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Brand Info */}
          <div className="md:w-2/3 p-8">
            <div className="space-y-4">
              {/* Brand Name and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {brand.name}
                  </h1>
                  <div className="flex gap-2">
                    {brand.isFeatured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured Brand
                      </span>
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      brand.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {brand.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
              </div>

              {/* Brand Description */}
              {brand.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 leading-relaxed">{brand.description}</p>
                </div>
              )}

              {/* Brand Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                {brand.contactEmail && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a
                        href={`mailto:${brand.contactEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {brand.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                {brand.contactPhone && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${brand.contactPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {brand.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Brand Address */}
              {brand.address && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-700">{brand.address}</p>
                  </div>
                </div>
              )}

              {/* Product Count */}
              {brand._count && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{brand._count.products}</span> products available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Products by {brand.name}
          </h2>
          
          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center">Sort by:</span>
            <button
              onClick={() => handleSortChange('price')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'createdAt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Newest {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchBrandProducts}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-2">No products found</p>
            <p className="text-gray-500">This brand doesn't have any products yet</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
