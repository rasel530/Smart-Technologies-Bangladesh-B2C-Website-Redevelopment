'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { CategoryImageUploader } from '@/components/admin/CategoryImageUploader';
import { CategorySEOEditor } from '@/components/admin/CategorySEOEditor';
import { Category } from '@/types/category';
import { getCategoryById } from '@/lib/api/categories';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin Category Edit Page
 *
 * Page for editing existing categories with:
 * - Fetch category data by ID
 * - CategoryForm component with pre-filled data
 * - CategoryImageUploader component
 * - CategorySEOEditor component
 * - Navigation back to categories list
 * - Loading states and error handling
 */
function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const resolvedParams = await params;
        const response = await getCategoryById(resolvedParams.id);
        setCategory(response.category);
      } catch (err: any) {
        console.error('Failed to load category:', err);
        setError(err.message || 'Failed to load category');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategory();
  }, [params]);

  const handleCancel = () => {
    router.push('/admin/categories');
  };

  const handleSuccess = () => {
    router.push('/admin/categories');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Category">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Edit Category">
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Category</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/admin/categories"
                  className="block w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Back to Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Category" description="Update category information and settings">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Form */}
          <div className="lg:col-span-2">
            {category && (
              <CategoryForm
                categoryId={category.id}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>

          {/* Right Column - Image Uploader and SEO Editor */}
          <div className="space-y-6">
            {category && (
              <>
                <CategoryImageUploader
                  categoryId={category.id}
                  onSuccess={() => {}}
                />

                <CategorySEOEditor
                  category={category}
                  onUpdate={() => {}}
                />
              </>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}

export default withAuth(EditCategoryPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
