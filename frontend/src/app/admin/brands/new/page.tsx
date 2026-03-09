'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandForm from '@/components/admin/BrandForm';
import { BrandLogoUploader } from '@/components/admin/BrandLogoUploader';
import { BrandSEOEditor } from '@/components/admin/BrandSEOEditor';
import { Brand } from '@/types/brand';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Create Brand Page
 * 
 * Page for creating a new brand with:
 * - BrandForm component for basic information
 * - BrandLogoUploader for logo management
 * - BrandSEOEditor for SEO settings
 * - Navigation back to brands list
 * - Loading states and error handling
 */
function NewBrandPage() {
  const router = useRouter();
  const [brand, setBrand] = React.useState<Brand | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSuccess = () => {
    // Brand created successfully, redirect to brands list
    router.push('/admin/brands');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin/brands');
    }
  };

  const handleBrandCreated = (createdBrand: Brand) => {
    setBrand(createdBrand);
  };

  return (
    <AdminLayout title="New Brand">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/brands"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Brands
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Brand Form */}
      <div className="space-y-6">
        <BrandForm
          brand={brand}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewBrandPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
