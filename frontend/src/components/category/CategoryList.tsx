/**
 * CategoryList Component
 * 
 * A listing component for displaying categories in grid or list layout.
 * Features include loading states, empty states, and search integration.
 * 
 * @component
 */

'use client';

import React from 'react';
import { CategoryWithRelations } from '@/types/category';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: CategoryWithRelations[];
  loading?: boolean;
  error?: string | null;
  layout?: 'grid' | 'list';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  showSubcategories?: boolean;
  className?: string;
}

/**
 * Loading Skeleton Component
 */
const CategorySkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ message?: string }> = ({ message = 'No categories found' }) => (
  <div className="col-span-full py-16 text-center">
    <svg
      className="mx-auto h-16 w-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
    <h3 className="mt-4 text-lg font-medium text-gray-900">{message}</h3>
    <p className="mt-2 text-sm text-gray-500">
      Try adjusting your search terms or filters.
    </p>
  </div>
);

/**
 * Error State Component
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="col-span-full py-16 text-center">
    <svg
      className="mx-auto h-16 w-16 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Categories</h3>
    <p className="mt-2 text-sm text-gray-500">{error}</p>
  </div>
);

/**
 * CategoryList Component
 * 
 * @param {CategoryListProps} props - Component props
 * @returns {JSX.Element} Category list component
 */
export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading = false,
  error = null,
  layout = 'grid',
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  showSubcategories = false,
  className = ''
}) => {
  // Grid columns based on breakpoints
  const gridClasses = `
    grid grid-cols-${columns.mobile || 1}
    sm:grid-cols-${columns.tablet || 2}
    lg:grid-cols-${columns.desktop || 3}
    xl:grid-cols-${(columns.desktop || 3) + 1}
    gap-6
  `;

  // Show loading skeleton
  if (loading) {
    return (
      <div className={`${gridClasses} ${className}`}>
        {[...Array(6)].map((_, index) => (
          <CategorySkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show empty state
  if (categories.length === 0) {
    return <EmptyState />;
  }

  // Grid layout
  if (layout === 'grid') {
    return (
      <div className={`${gridClasses} ${className}`}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            showDescription
            showCounts
            showSubcategories={showSubcategories}
          />
        ))}
      </div>
    );
  }

  // List layout
  return (
    <div className={`space-y-4 ${className}`}>
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <CategoryCard
            category={category}
            showDescription
            showCounts
            showSubcategories={showSubcategories}
            className="flex"
          />
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
