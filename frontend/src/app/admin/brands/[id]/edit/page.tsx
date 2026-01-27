'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandForm from '@/components/admin/BrandForm';
import { BrandLogoUploader } from '@/components/admin/BrandLogoUploader';
import { BrandSEOEditor } from '@/components/admin/BrandSEOEditor';
import { Brand } from '@/types/brand';
import brandsApi from '@/lib/api/brands';

/**
 * Edit Brand Page
 * 
 * Page for editing an existing brand with:
 * - Fetch brand data by ID
 * - BrandForm component with pre-filled data
 * - BrandLogoUploader for logo management
 * - BrandSEOEditor for SEO settings
 * - Navigation back to brands list
 * - Loading states and error handling
 */
export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchBrand();
    }
  }, [params.id]);

  const fetchBrand = async () => {
    setLoading(true);
    setError(null);
    try {
      const brandData = await brandsApi.getBrandById(params.id as string);
      setBrand(brandData);
    } catch (err: any) {
      console.error('Error fetching brand:', err);
      setError(err.message || 'Failed to load brand');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Brand updated successfully, redirect to brands list
    router.push('/admin/brands');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin/brands');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading brand...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Brand</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={fetchBrand}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <Link
                href="/admin/brands"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Brands
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Brand Not Found</h2>
            <p className="text-gray-600 mb-4">The brand you're looking for doesn't exist or has been deleted.</p>
            <Link
              href="/admin/brands"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Brands
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Brand: {brand.name}</h1>

        {/* Brand Form */}
        <div className="space-y-6">
          <BrandForm
            brand={brand}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
