/**
 * BrandCard Component
 * 
 * A brand card component for displaying brands in grid/list views.
 * Features include logo/image display, brand name, description, and product count.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BrandWithRelations } from '@/types/brand';

interface BrandCardProps {
  brand: BrandWithRelations;
  showDescription?: boolean;
  showProductCount?: boolean;
  className?: string;
}

/**
 * BrandCard Component
 * 
 * @param {BrandCardProps} props - Component props
 * @returns {JSX.Element} Brand card component
 */
export const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  showDescription = true,
  showProductCount = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Get brand logo or fallback
  const logoUrl = brand.websiteUrl
    ? `https://www.google.com/s2/favicons?domain=${new URL(brand.websiteUrl).hostname}&sz=128`
    : '/images/placeholder-brand.png';

  // Truncate description
  const truncatedDescription = brand.description
    ? brand.description.length > 100
      ? `${brand.description.substring(0, 100)}...`
      : brand.description
    : null;

  // Product count
  const productCount = brand._count?.products || 0;

  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={`
        group relative bg-white rounded-lg shadow-sm hover:shadow-xl
        transition-all duration-300 overflow-hidden
        ${brand.status !== 'active' ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Brand Logo/Icon */}
      <div className="relative aspect-square bg-gray-50 p-8 flex items-center justify-center">
        {!imageError ? (
          <Image
            src={logoUrl}
            alt={brand.name}
            width={128}
            height={128}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary-600">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{brand.name}</p>
            </div>
          </div>
        )}

        {/* Inactive Badge */}
        {brand.status !== 'active' && (
          <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Inactive
          </div>
        )}
      </div>

      {/* Brand Info */}
      <div className="p-4">
        {/* Brand Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-primary-600 transition-colors">
          {brand.name}
        </h3>

        {/* Description */}
        {showDescription && truncatedDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncatedDescription}
          </p>
        )}

        {/* Product Count */}
        {showProductCount && productCount > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </span>
          </div>
        )}

        {/* Website Link */}
        {brand.websiteUrl && (
          <div className="mt-3">
            <a
              href={brand.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </Link>
  );
};

export default BrandCard;
