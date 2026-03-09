'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Folder, Check, X } from 'lucide-react';
import { CategoryList } from '@/components/admin/CategoryList';
import { CategoryTreeEditor } from '@/components/admin/CategoryTreeEditor';
import { withAuth } from '@/components/auth/withAuth';
import { getCategoryStats } from '@/lib/api/categories';
import { PageWrapper, StatsGrid } from '@/components/design-system';
import { ButtonPrimary } from '@/components/design-system';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

  const statsData = [
    {
      title: 'Total Categories',
      value: isLoadingStats ? 'Loading...' : statsError ? '-' : stats.total,
      icon: <Folder className="w-6 h-6 text-primary-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Categories',
      value: isLoadingStats ? 'Loading...' : statsError ? '-' : stats.active,
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'Inactive Categories',
      value: isLoadingStats ? 'Loading...' : statsError ? '-' : stats.inactive,
      icon: <X className="w-6 h-6 text-neutral-600" />,
      color: 'default' as const,
    },
  ];

  return (
    <AdminLayout title="Category Management" description="Manage your product categories and hierarchy">
      {/* Statistics */}
      <StatsGrid stats={statsData} columns={3} />

      {/* Section Divider */}
      <div className="border-t border-neutral-200 my-8"></div>

      {/* Category List and Tree Editor */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex">
              <button className="w-1/2 py-4 px-6 text-center border-b-2 border-primary-500 text-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                Category List
              </button>
              <button className="w-1/2 py-4 px-6 text-center border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                Tree Editor
              </button>
            </nav>
          </div>
          <div className="p-6">
            <CategoryList />
          </div>
        </div>

        {/* Optional: Tree Editor section (can be toggled) */}
        <details className="bg-white rounded-xl shadow-md">
          <summary className="px-6 py-4 cursor-pointer hover:bg-neutral-50 font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            Advanced: Category Tree Editor (Drag & Drop)
          </summary>
          <div className="border-t border-neutral-200 p-6">
            <CategoryTreeEditor />
          </div>
        </details>
      </div>
    </AdminLayout>
  );
}

export default withAuth(CategoriesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
