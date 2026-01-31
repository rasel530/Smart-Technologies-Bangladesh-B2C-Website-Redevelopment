'use client';

import React, { useState, useEffect } from 'react';
import { Brand, CreateBrandRequest, UpdateBrandRequest, BrandStatus } from '@/types/brand';
import brandsApi from '@/lib/api/brands';
import { BrandLogoUploader } from './BrandLogoUploader';
import { BrandSEOEditor } from './BrandSEOEditor';
import { useShowToast } from '@/components/ui/Toast';

interface BrandFormProps {
  brand?: Brand;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Admin BrandForm Component
 * 
 * Form for creating/editing brands with:
 * - All brand fields including SEO fields
 * - Status toggle
 * - Featured toggle
 * - Featured order input
 * - Form validation
 */
export default function BrandForm({ brand, onSuccess, onCancel }: BrandFormProps) {
  const toast = useShowToast();
  const [formData, setFormData] = useState<CreateBrandRequest | UpdateBrandRequest>({
    name: brand?.name || '',
    nameEn: brand?.nameEn || '',
    nameBn: brand?.nameBn || '',
    slug: brand?.slug || '',
    description: brand?.description || '',
    websiteUrl: brand?.websiteUrl || '',
    contactEmail: brand?.contactEmail || '',
    contactPhone: brand?.contactPhone || '',
    address: brand?.address || '',
    status: brand?.status || 'active',
    isFeatured: brand?.isFeatured || false,
    featuredOrder: brand?.featuredOrder || 0,
    metaTitle: brand?.metaTitle || '',
    metaDescription: brand?.metaDescription || '',
    metaKeywords: brand?.metaKeywords || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '-')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    handleChange(e);
    // Auto-generate slug if not editing
    if (!brand) {
      setFormData(prev => ({ ...prev, slug: generateSlug(name) }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Brand name is required';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }
    
    if (formData.websiteUrl && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Invalid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (brand) {
        await brandsApi.updateBrand(brand.id, formData);
        toast.success('Brand updated successfully!', 'Success');
      } else {
        await brandsApi.createBrand(formData as CreateBrandRequest);
        toast.success('Brand created successfully!', 'Success');
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      toast.error(error.message || 'Failed to save brand', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
          {brand ? 'Edit Brand' : 'Create New Brand'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter brand name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              disabled={!!brand}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="brand-name"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>
        </div>

        {/* Bilingual Names */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* English Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Name
            </label>
            <input
              type="text"
              name="nameEn"
              value={formData.nameEn || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brand name in English"
            />
          </div>

          {/* Bangla Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bangla Name
            </label>
            <input
              type="text"
              name="nameBn"
              value={formData.nameBn || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ব্র্যান্ডের নাম"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter brand description"
          />
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.websiteUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.contactEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="contact@example.com"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+8801234567890"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter brand address"
          />
        </div>

        {/* Featured Settings */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Featured Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Featured Brand</span>
            </label>
          </div>

          {/* Featured Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Order
            </label>
            <input
              type="number"
              name="featuredOrder"
              value={formData.featuredOrder}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Logo Uploader */}
      <BrandLogoUploader
        brandId={brand?.id}
        currentLogoUrl={logoUrl}
        onLogoChange={setLogoUrl}
      />

      {/* SEO Editor */}
      <BrandSEOEditor
        brandId={brand?.id}
        initialSEO={{
          metaTitle: formData.metaTitle || '',
          metaDescription: formData.metaDescription || '',
          metaKeywords: formData.metaKeywords || ''
        }}
        onSEOChange={(seo) => {
          setFormData(prev => ({ ...prev, ...seo }));
        }}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 0 018 8 0 01-8 8z"></path>
            </svg>
          )}
          {isSubmitting ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
        </button>
      </div>
    </form>
  );
}
