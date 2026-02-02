/**
 * Multi-Level Category Navigation Component
 * 
 * Features:
 * - Nested category hierarchy display
 * - Hover/click to expand subcategories
 * - Responsive design (dropdown on desktop, accordion on mobile)
 * - Active category highlighting
 * - Keyboard navigation
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface CategoryNode {
  id: string;
  name: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  image?: string;
  children?: CategoryNode[];
  isActive?: boolean;
  itemCount?: number;
}

interface CategoryNavigationProps {
  categories: CategoryNode[];
  variant?: 'dropdown' | 'sidebar' | 'mega-menu';
  maxDepth?: number;
  className?: string;
  onCategoryClick?: (category: CategoryNode) => void;
}

export function CategoryNavigation({
  categories,
  variant = 'dropdown',
  maxDepth = 3,
  className = '',
  onCategoryClick
}: CategoryNavigationProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only running pathname-based logic after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Check if category is active based on current path (only after mount to prevent hydration mismatch)
  useEffect(() => {
    if (!isMounted) return;

    const findActiveCategory = (cats: CategoryNode[]): string | null => {
      for (const cat of cats) {
        if (pathname === `/categories/${cat.slug}` || pathname === `/categories/${cat.slug}/`) {
          return cat.id;
        }
        if (cat.children) {
          const found = findActiveCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    const activeId = findActiveCategory(categories);
    setActiveCategory(activeId);
  }, [pathname, categories, isMounted]);

  // Close dropdown when clicking outside (for dropdown variant)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedCategories(new Set());
      }
    };

    if (variant === 'dropdown') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [variant]);

  // Render category tree recursively
  const renderCategory = (
    category: CategoryNode,
    depth: number = 0
  ): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isActive = isMounted && activeCategory === category.id;
    const indent = depth * 16;

    const displayHasChildren = depth < maxDepth && hasChildren;

    const itemContent = (
      <div
        className={`
          flex items-center justify-between py-2 px-3 rounded-lg transition-colors
          ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
        `}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {category.image && (
            <img
              src={category.image}
              alt={category.name}
              className="w-5 h-5 object-contain flex-shrink-0"
            />
          )}
          <span className="font-medium truncate">{category.name}</span>
          {category.itemCount !== undefined && (
            <span className="text-xs text-gray-400 ml-1">({category.itemCount})</span>
          )}
        </div>

        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCategory(category.id);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    );

    return (
      <div key={category.id} className="relative">
        {displayHasChildren ? (
          <>
            <div
              onClick={() => {
                if (variant === 'sidebar' || variant === 'mega-menu') {
                  toggleCategory(category.id);
                }
              }}
              className="cursor-pointer"
            >
              {itemContent}
            </div>

            {isExpanded && (
              <div className="mt-1">
                {category.children!.map(child => renderCategory(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={`/categories/${category.slug}`}
            onClick={() => onCategoryClick?.(category)}
            className="block"
          >
            {itemContent}
          </Link>
        )}
      </div>
    );
  };

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          onClick={() => {
            // Toggle dropdown by adding/removing a special marker
            setExpandedCategories(prev => {
              const newSet = new Set(prev);
              if (newSet.has('dropdown')) {
                newSet.delete('dropdown');
              } else {
                newSet.add('dropdown');
              }
              return newSet;
            });
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-haspopup="true"
          aria-expanded={expandedCategories.has('dropdown')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Categories</span>
        </button>

        {expandedCategories.has('dropdown') && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Categories</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {categories.map(cat => renderCategory(cat))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div ref={containerRef} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Categories</h3>
        </div>
        <div className="p-2">
          {categories.map(cat => renderCategory(cat))}
        </div>
      </div>
    );
  }

  // Mega menu variant
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-haspopup="true"
        aria-expanded={expandedCategories.size > 0}
      >
        <span>Shop by Category</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedCategories.size > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-50">
          <div className="grid grid-cols-4 gap-6">
            {categories.map(category => (
              <div key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="block font-semibold text-gray-900 hover:text-blue-600 mb-3"
                  onClick={() => onCategoryClick?.(category)}
                >
                  {category.name}
                </Link>
                {category.children && category.children.length > 0 && (
                  <ul className="space-y-2">
                    {category.children.map(child => (
                      <li key={child.id}>
                        <Link
                          href={`/categories/${child.slug}`}
                          className="text-sm text-gray-600 hover:text-blue-600"
                          onClick={() => onCategoryClick?.(child)}
                        >
                          {child.name}
                        </Link>
                        {child.children && child.children.length > 0 && (
                          <ul className="mt-2 ml-3 space-y-1 border-l-2 border-gray-100 pl-3">
                            {child.children.map(grandchild => (
                              <li key={grandchild.id}>
                                <Link
                                  href={`/categories/${grandchild.slug}`}
                                  className="text-sm text-gray-500 hover:text-blue-600"
                                  onClick={() => onCategoryClick?.(grandchild)}
                                >
                                  {grandchild.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryNavigation;
