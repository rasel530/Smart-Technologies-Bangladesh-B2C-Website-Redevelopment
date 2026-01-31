/**
 * CategoryCard Component
 * 
 * A category card component for displaying categories in grid/list views.
 * Features include icon/image display, category name, description, and counts.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CategoryWithRelations, CategoryStatus } from '@/types/category';

interface CategoryCardProps {
  category: CategoryWithRelations;
  showDescription?: boolean;
  showCounts?: boolean;
  showSubcategories?: boolean;
  className?: string;
}

/**
 * CategoryCard Component
 * 
 * @param {CategoryCardProps} props - Component props
 * @returns {JSX.Element} Category card component
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  showDescription = true,
  showCounts = true,
  showSubcategories = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Get category icon or banner image
  const imageUrl = category.bannerImage || category.iconUrl || '';

  // Truncate description
  const truncatedDescription = category.description
    ? category.description.length > 100
      ? `${category.description.substring(0, 100)}...`
      : category.description
    : null;

  // Product and subcategory counts
  const productCount = category._count?.products || 0;
  const subcategoryCount = category._count?.subcategories || 0;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={`
        group relative bg-white rounded-lg shadow-sm hover:shadow-xl
        transition-all duration-300 overflow-hidden
        ${category.status !== CategoryStatus.ACTIVE ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Category Image/Icon */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">{category.name}</p>
            </div>
          </div>
        )}

        {/* Inactive Badge */}
        {category.status !== CategoryStatus.ACTIVE && (
          <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Inactive
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Category Info */}
      <div className="p-4">
        {/* Category Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-primary-600 transition-colors">
          {category.name}
        </h3>

        {/* Description */}
        {showDescription && truncatedDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncatedDescription}
          </p>
        )}

        {/* Counts */}
        {showCounts && (productCount > 0 || subcategoryCount > 0) && (
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            {productCount > 0 && (
              <div className="flex items-center">
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
            {subcategoryCount > 0 && (
              <div className="flex items-center">
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span>
                  {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Subcategories Preview */}
        {showSubcategories && category.subcategories && category.subcategories.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Subcategories</p>
            <div className="flex flex-wrap gap-1">
              {category.subcategories.slice(0, 3).map((subcategory) => (
                <span
                  key={subcategory.id}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {subcategory.name}
                </span>
              ))}
              {category.subcategories.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{category.subcategories.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
