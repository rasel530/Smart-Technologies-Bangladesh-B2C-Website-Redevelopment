'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryPath } from '@/types/category';

interface CategoryBreadcrumbProps {
  categories: CategoryPath[];
  currentCategory?: string;
  className?: string;
}

/**
 * CategoryBreadcrumb Component
 * 
 * Breadcrumb navigation for category pages
 * Shows full path from root to current category
 */
export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
  currentCategory,
  className = ''
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link
        href="/"
        className="text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </Link>

      {/* Separator */}
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>

      {/* Category path */}
      {categories.map((category, index) => (
        <React.Fragment key={category.id}>
          {index > 0 && (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}

          {index === categories.length - 1 ? (
            /* Current category - not a link */
            <span className="text-gray-900 font-medium" aria-current="page">
              {category.name}
            </span>
          ) : (
            /* Parent category - link */
            <Link
              href={`/categories/${category.slug}`}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              {category.name}
            </Link>
          )}
        </React.Fragment>
      ))}

      {/* Current category if not in path */}
      {currentCategory && !categories.find((c) => c.name === currentCategory) && (
        <>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium" aria-current="page">
            {currentCategory}
          </span>
        </>
      )}
    </nav>
  );
};
