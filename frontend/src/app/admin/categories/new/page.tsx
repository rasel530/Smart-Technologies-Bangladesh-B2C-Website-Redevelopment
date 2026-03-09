'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { CategoryImageUploader } from '@/components/admin/CategoryImageUploader';
import { CategorySEOEditor } from '@/components/admin/CategorySEOEditor';
import { Category } from '@/types/category';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin Category Creation Page
 * 
 * Page for creating new categories with:
 * - CategoryForm component
 * - CategoryImageUploader component
 * - CategorySEOEditor component
 * - Navigation back to categories list
 * - Loading states and error handling
 */
function NewCategoryPage() {
  const router = useRouter();
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryCreated = (category: Category) => {
    setCreatedCategory(category);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    router.push('/admin/categories');
  };

  const handleSuccess = () => {
    router.push('/admin/categories');
  };

  return (
    <AdminLayout title="New Category" description="Add a new category to your product catalog">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Form */}
          <div className="lg:col-span-2">
            <CategoryForm
              onSuccess={handleCategoryCreated}
              onCancel={handleCancel}
            />
          </div>

          {/* Right Column - Image Uploader and SEO Editor */}
          <div className="space-y-6">
            {createdCategory && (
              <>
                <CategoryImageUploader
                  categoryId={createdCategory.id}
                  onSuccess={() => {}}
                />

                <CategorySEOEditor
                  category={createdCategory}
                  onUpdate={() => {}}
                />

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category Created Successfully
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your category has been created. You can now upload an image and configure SEO settings.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Category ID:</span>{' '}
                      <span className="font-mono text-gray-900">{createdCategory.id}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="font-medium text-gray-900">{createdCategory.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Slug:</span>{' '}
                      <span className="font-mono text-gray-900">{createdCategory.slug}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSuccess}
                    className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Categories
                  </button>
                </div>
              </>
            )}

            {!createdCategory && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Create Category First
                  </h3>
                  <p className="text-sm text-gray-500">
                    Fill in the category form on the left to create a new category. Once created, you can upload an image and configure SEO settings here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}

export default withAuth(NewCategoryPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
