'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryList } from '@/components/admin/CategoryList';
import { CategoryTreeEditor } from '@/components/admin/CategoryTreeEditor';
import { withAuth } from '@/components/auth/withAuth';
import { getCategoryStats } from '@/lib/api/categories';

/**
 * Categories Admin Page
 * 
 * Main page for managing categories with:
 * - Category list with tree view
 * - Category tree editor for drag-and-drop reordering
 * - Statistics section
 * - Navigation to create new category
 */
function CategoriesPage() {
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
  }>({ total: 0, active: 0, inactive: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const statsData = await getCategoryStats();
        setStats(statsData);
      } catch (err: any) {
        setStatsError(err.message || 'Failed to load statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-2">Manage your product categories and hierarchy</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                {isLoadingStats ? (
                  <p className="text-2xl font-bold text-gray-900">Loading...</p>
                ) : statsError ? (
                  <p className="text-2xl font-bold text-red-600">-</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Categories</p>
                {isLoadingStats ? (
                  <p className="text-2xl font-bold text-green-600">Loading...</p>
                ) : statsError ? (
                  <p className="text-2xl font-bold text-red-600">-</p>
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Categories</p>
                {isLoadingStats ? (
                  <p className="text-2xl font-bold text-gray-600">Loading...</p>
                ) : statsError ? (
                  <p className="text-2xl font-bold text-red-600">-</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                )}
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link
              href="/admin/categories/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Category
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            Use the list view or tree editor to manage categories
          </div>
        </div>

        {/* Category List and Tree Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button className="w-1/2 py-4 px-6 text-center border-b-2 border-blue-500 text-blue-600 font-medium">
                  Category List
                </button>
                <button className="w-1/2 py-4 px-6 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">
                  Tree Editor
                </button>
              </nav>
            </div>
            <div className="p-6">
              <CategoryList />
            </div>
          </div>

          {/* Optional: Tree Editor section (can be toggled) */}
          <details className="bg-white rounded-lg shadow">
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-medium text-gray-900">
              Advanced: Category Tree Editor (Drag & Drop)
            </summary>
            <div className="border-t border-gray-200 p-6">
              <CategoryTreeEditor />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CategoriesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
