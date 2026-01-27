'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, CategoryTree } from '@/types/category';
import { getCategoryTree } from '@/lib/api/categories';

interface CategoryNavigationProps {
  className?: string;
  maxDepth?: number;
}

/**
 * Recursive component for rendering category tree items
 */
const CategoryTreeItem: React.FC<{
  category: CategoryTree;
  depth: number;
  maxDepth: number;
  onClose?: () => void;
}> = ({ category, depth, maxDepth, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const canExpand = depth < maxDepth;

  return (
    <li className="relative">
      <div className="flex items-center">
        {hasChildren && canExpand && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
          </button>
        )}
        
        <Link
          href={`/categories/${category.slug}`}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex-1"
        >
          {category.iconUrl && (
            <img
              src={category.iconUrl}
              alt={category.name}
              className="w-5 h-5 object-contain"
            />
          )}
          <span className="font-medium">{category.name}</span>
        </Link>
      </div>

      {hasChildren && canExpand && isExpanded && (
        <ul className="ml-4 mt-1 space-y-1">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * CategoryNavigation Component
 * 
 * Multi-level category navigation menu with recursive rendering
 * Supports unlimited nesting levels
 */
export const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  className = '',
  maxDepth = 3
}) => {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getCategoryTree('active');
        setCategories(response.tree);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <nav className={className} aria-label="Category navigation">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 rounded"
            />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`hidden md:block ${className}`} aria-label="Category navigation">
        <ul className="space-y-1">
          {categories.map((category) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              depth={0}
              maxDepth={maxDepth}
            />
          ))}
        </ul>
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Open category menu"
      >
        <svg
          className="w-6 h-6"
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
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Categories</h2>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="p-4" aria-label="Mobile category navigation">
              <ul className="space-y-1">
                {categories.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    depth={0}
                    maxDepth={maxDepth}
                    onClose={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
