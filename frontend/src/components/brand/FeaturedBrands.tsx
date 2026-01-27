'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandWithRelations } from '@/types/brand';
import brandsApi from '@/lib/api/brands';

interface FeaturedBrandsProps {
  limit?: number;
  showTitle?: boolean;
  showViewAll?: boolean;
  autoScroll?: boolean;
  scrollInterval?: number;
}

/**
 * FeaturedBrands Component
 * 
 * Displays a featured brands showcase section with:
 * - Carousel or grid layout
 * - Brand logos with links
 * - Responsive design
 */
export default function FeaturedBrands({
  limit = 10,
  showTitle = true,
  showViewAll = true,
  autoScroll = false,
  scrollInterval = 5000
}: FeaturedBrandsProps) {
  const [brands, setBrands] = useState<BrandWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchFeaturedBrands();
  }, []);

  useEffect(() => {
    if (!autoScroll || isPaused || brands.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % brands.length);
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, isPaused, brands.length, scrollInterval]);

  const fetchFeaturedBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await brandsApi.getFeaturedBrands();
      setBrands(response.brands.slice(0, limit));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch featured brands');
      console.error('Error fetching featured brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + brands.length) % brands.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % brands.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFeaturedBrands}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Section Header */}
      {showTitle && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Featured Brands</h2>
          </div>
          {showViewAll && (
            <Link
              href="/brands"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Buttons */}
        {brands.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Previous brand"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Next brand"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Brand Cards Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`
            }}
          >
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="w-full flex-shrink-0 p-6"
              >
                <Link
                  href={`/brands/${brand.slug}`}
                  className="group block"
                >
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300">
                    {/* Brand Logo */}
                    <div className="aspect-square flex items-center justify-center mb-4">
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={200}
                          height={200}
                          className="max-w-full max-h-[200px] object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Brand Name */}
                    <h3 className="text-xl font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                      {brand.name}
                    </h3>

                    {/* Product Count */}
                    {brand._count && brand._count.products > 0 && (
                      <p className="text-sm text-gray-600 text-center mt-2">
                        {brand._count.products} {brand._count.products === 1 ? 'product' : 'products'}
                      </p>
                    )}

                    {/* Featured Badge */}
                    <div className="flex justify-center mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Indicators */}
        {brands.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 pb-4">
            {brands.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === index
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
