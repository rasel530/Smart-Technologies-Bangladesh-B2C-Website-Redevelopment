/**
 * Categories Listing Page
 * 
 * Server component for listing all categories.
 * Features include:
 * - Server-side data fetching for SEO
 * - Display category tree structure
 * - Search functionality
 * - Filter by active/inactive status
 * - Breadcrumb navigation
 * - SEO metadata
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories, getCategoryTree } from '@/lib/api/categories';
import { CategoryWithRelations, CategoryTree } from '@/types/category';
import { CategoryList } from '@/components/category/CategoryList';
import { CategoryTreeComponent } from '@/components/category/CategoryTree';

/**
 * Categories Listing Page Component
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithRelations[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const [categoriesData, treeData] = await Promise.all([
          getCategories(),
          getCategoryTree(),
        ]);
        setCategories(categoriesData.categories || []);
        setFilteredCategories(categoriesData.categories || []);
        setCategoryTree(treeData.tree || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search and status
  useEffect(() => {
    let filtered = categories;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query))
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(category => category.isActive);
    }

    setFilteredCategories(filtered);
  }, [searchQuery, showInactive, categories]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Toggle inactive categories
  const handleToggleInactive = () => {
    setShowInactive(!showInactive);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setShowInactive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 py-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Categories</li>
          </ol>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Categories</h1>
          <p className="text-gray-600">
            Browse our comprehensive collection of technology categories
          </p>
          {categories.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredCategories.length} of {categories.length} categories
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Input */}
            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Search categories"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="flex items-center gap-4">
              {/* Show Inactive Toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={handleToggleInactive}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show inactive</span>
              </label>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-500'
                  }`}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`p-2 transition-colors ${
                    viewMode === 'tree' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-500'
                  }`}
                  aria-label="Tree view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || showInactive) && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Grid or Tree */}
        {viewMode === 'grid' ? (
          <CategoryList
            categories={filteredCategories}
            loading={loading}
            error={error}
            layout="grid"
            showSubcategories={false}
            columns={{
              mobile: 1,
              tablet: 2,
              desktop: 3,
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CategoryTreeComponent
              categories={categoryTree}
              showCounts={true}
              maxDepth={3}
            />
          </div>
        )}

        {/* Empty State Message */}
        {!loading && filteredCategories.length === 0 && categories.length > 0 && (
          <div className="text-center py-16">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
