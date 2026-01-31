'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductStatus, ProductVisibility, CreateProductRequest, ProductWithRelations } from '@/types/product';
import { Category } from '@/types/category';
import { Brand } from '@/types/brand';
import productsApi from '@/lib/api/products';
import categoriesApi from '@/lib/api/categories';
import brandsApi from '@/lib/api/brands';
import { generateSlug } from '@/lib/utils/slug';
import { useShowToast } from '@/components/ui/Toast';
import { ProductCategoryManager } from './ProductCategoryManager';
import { ProductBrandManager } from './ProductBrandManager';
import { ProductVariantRelationships } from './ProductVariantRelationships';
import { CrossSellManager } from './CrossSellManager';
import { UpSellManager } from './UpSellManager';
import { RelatedProductsManager } from './RelatedProductsManager';

interface ProductFormProps {
  product?: ProductWithRelations;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  onCancel: () => void;
  categories?: Category[];
  brands?: Brand[];
  allProducts?: Array<{ id: string; name: string; sku: string; regularPrice: number; salePrice: number | null }>;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  categories = [],
  brands = [],
  allProducts = []
}) => {
  const toast = useShowToast();
  const [formData, setFormData] = useState<CreateProductRequest>({
    sku: '',
    name: '',
    nameEn: '',
    nameBn: '',
    slug: '',
    shortDescription: '',
    description: '',
    categories: [],
    brandId: '',
    regularPrice: 0,
    salePrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    taxRate: 0,
    status: 'draft',
    visibility: 'public',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    warrantyPeriod: 0,
    warrantyType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'categories' | 'brand' | 'variants' | 'cross-sell' | 'up-sell' | 'related'>('basic');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Fetch categories and brands on component mount
  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        setLoadingCategories(true);
        const categoriesResponse = await categoriesApi.getCategories({ status: 'active', limit: 100 });
        setAvailableCategories(categoriesResponse.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }

      try {
        setLoadingBrands(true);
        const brandsResponse = await brandsApi.getBrands({ status: 'active', limit: 100 });
        setAvailableBrands(brandsResponse.brands || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchCategoriesAndBrands();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        nameEn: product.nameEn,
        nameBn: product.nameBn || '',
        slug: product.slug,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        categories: product.categories?.map(pc => pc.categoryId) || [],
        brandId: product.brandId,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice || 0,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        taxRate: product.taxRate,
        status: product.status,
        visibility: product.visibility,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        metaKeywords: product.metaKeywords || '',
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        warrantyPeriod: product.warrantyPeriod || 0,
        warrantyType: product.warrantyType || '',
      });
      // If editing an existing product, consider the slug as already manually edited
      setSlugManuallyEdited(true);
    }
  }, [product]);

  // Auto-generate slug when nameEn changes
  useEffect(() => {
    if (formData.nameEn && !slugManuallyEdited && !formData.slug) {
      const generatedSlug = generateSlug(formData.nameEn);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.nameEn, slugManuallyEdited, formData.slug]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.nameEn) newErrors.nameEn = 'English name is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    if (!formData.categories || formData.categories.length === 0) newErrors.categories = 'At least one category is required';
    if (!formData.brandId) newErrors.brandId = 'Brand is required';
    if (formData.regularPrice <= 0) newErrors.regularPrice = 'Regular price must be greater than 0';
    if (formData.costPrice <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      const successMessage = product 
        ? 'Product updated successfully!' 
        : 'Product created successfully!';
      toast.success(successMessage, 'Success');
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error('Failed to save product', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSlugChange = (value: string) => {
    setFormData(prev => ({ ...prev, slug: value }));
    setSlugManuallyEdited(true);
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  // Handler functions for relationship managers
  const handleCategoriesUpdate = async (categories: any[]) => {
    console.log('Categories updated:', categories);
    if (product?.id) {
      try {
        const categoryIds = categories.map((c: any) => c.categoryId);
        await productsApi.assignProductCategories(product.id, categoryIds);
      } catch (error) {
        console.error('Failed to update categories:', error);
        alert('Failed to update categories');
      }
    }
  };

  const handleBrandUpdate = async (brand: any) => {
    console.log('Brand updated:', brand);
    if (product?.id && brand?.brandId) {
      try {
        await productsApi.assignProductBrand(product.id, brand.brandId);
      } catch (error) {
        console.error('Failed to update brand:', error);
        alert('Failed to update brand');
      }
    }
  };

  // Cross-sell product handlers
  const handleAddCrossSell = async (relatedProductId: string, displayOrder?: number) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.addCrossSellProduct(product.id, relatedProductId, displayOrder);
    } catch (error) {
      console.error('Failed to add cross-sell product:', error);
      alert('Failed to add cross-sell product');
      throw error;
    }
  };

  const handleRemoveCrossSell = async (relatedProductId: string) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.removeCrossSellProduct(product.id, relatedProductId);
    } catch (error) {
      console.error('Failed to remove cross-sell product:', error);
      alert('Failed to remove cross-sell product');
      throw error;
    }
  };

  const handleReorderCrossSell = async (orders: Array<{ relatedProductId: string; displayOrder: number }>) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.reorderCrossSellProducts(product.id, orders);
    } catch (error) {
      console.error('Failed to reorder cross-sell products:', error);
      alert('Failed to reorder cross-sell products');
      throw error;
    }
  };

  // Up-sell product handlers
  const handleAddUpSell = async (relatedProductId: string, displayOrder?: number) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.addUpSellProduct(product.id, relatedProductId, displayOrder);
    } catch (error) {
      console.error('Failed to add up-sell product:', error);
      alert('Failed to add up-sell product');
      throw error;
    }
  };

  const handleRemoveUpSell = async (relatedProductId: string) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.removeUpSellProduct(product.id, relatedProductId);
    } catch (error) {
      console.error('Failed to remove up-sell product:', error);
      alert('Failed to remove up-sell product');
      throw error;
    }
  };

  const handleReorderUpSell = async (orders: Array<{ relatedProductId: string; displayOrder: number }>) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.reorderUpSellProducts(product.id, orders);
    } catch (error) {
      console.error('Failed to reorder up-sell products:', error);
      alert('Failed to reorder up-sell products');
      throw error;
    }
  };

  // Related product handlers
  const handleAddRelated = async (relatedProductId: string, displayOrder?: number) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.addRelatedProduct(product.id, relatedProductId, displayOrder);
    } catch (error) {
      console.error('Failed to add related product:', error);
      alert('Failed to add related product');
      throw error;
    }
  };

  const handleRemoveRelated = async (relatedProductId: string) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.removeRelatedProduct(product.id, relatedProductId);
    } catch (error) {
      console.error('Failed to remove related product:', error);
      alert('Failed to remove related product');
      throw error;
    }
  };

  const handleReorderRelated = async (orders: Array<{ relatedProductId: string; displayOrder: number }>) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.reorderRelatedProducts(product.id, orders);
    } catch (error) {
      console.error('Failed to reorder related products:', error);
      alert('Failed to reorder related products');
      throw error;
    }
  };

  // Variant relationship handler
  const handleSetVariantParent = async (variantId: string, parentId: string | null) => {
    if (!product?.id) {
      console.error('No product ID available');
      return;
    }

    try {
      await productsApi.setVariantParent(product.id, variantId, parentId || undefined);
    } catch (error) {
      console.error('Failed to set variant parent:', error);
      alert('Failed to set variant parent');
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Name *
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => handleChange('nameEn', e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.nameEn ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nameEn && <p className="text-red-500 text-sm mt-1">{errors.nameEn}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bangla Name
            </label>
            <input
              type="text"
              value={formData.nameBn}
              onChange={(e) => handleChange('nameBn', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formData.slug && !slugManuallyEdited && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Auto-generated from product name">
                    Auto
                  </span>
                </div>
              )}
            </div>
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Category *
            </label>
            <select
              value={formData.categories[0] || ''}
              onChange={(e) => {
                const newCategories = e.target.value ? [e.target.value] : [];
                handleChange('categories', newCategories);
              }}
              disabled={loadingCategories}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.categories ? 'border-red-500' : 'border-gray-300'
              } ${loadingCategories ? 'opacity-50' : ''}`}
            >
              <option value="">{loadingCategories ? 'Loading categories...' : 'Select Category'}</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => handleChange('brandId', e.target.value)}
              disabled={loadingBrands}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.brandId ? 'border-red-500' : 'border-gray-300'
              } ${loadingBrands ? 'opacity-50' : ''}`}
            >
              <option value="">{loadingBrands ? 'Loading brands...' : 'Select Brand'}</option>
              {availableBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && <p className="text-red-500 text-sm mt-1">{errors.brandId}</p>}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regular Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">৳</span>
              <input
                type="number"
                step="0.01"
                value={formData.regularPrice}
                onChange={(e) => handleChange('regularPrice', parseFloat(e.target.value))}
                className={`w-full pl-8 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                  errors.regularPrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.regularPrice && <p className="text-red-500 text-sm mt-1">{errors.regularPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">৳</span>
              <input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => handleChange('salePrice', parseFloat(e.target.value))}
                className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">৳</span>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', parseFloat(e.target.value))}
                className={`w-full pl-8 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                  errors.costPrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value))}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status and Visibility */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as ProductStatus)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => handleChange('visibility', e.target.value as ProductVisibility)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              maxLength={60}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaTitle?.length || 0}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaDescription?.length || 0}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={formData.metaKeywords}
              onChange={(e) => handleChange('metaKeywords', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Featured Product</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isNewArrival}
              onChange={(e) => handleChange('isNewArrival', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">New Arrival</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isBestSeller}
              onChange={(e) => handleChange('isBestSeller', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Best Seller</span>
          </label>
        </div>
      </div>

      {/* Warranty */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Warranty</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warranty Period (months)
            </label>
            <input
              type="number"
              value={formData.warrantyPeriod}
              onChange={(e) => handleChange('warrantyPeriod', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warranty Type
            </label>
            <input
              type="text"
              value={formData.warrantyType}
              onChange={(e) => handleChange('warrantyType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Manufacturer Warranty, Extended Warranty"
            />
          </div>
        </div>
      </div>

      {/* Relationship Managers Tabs */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brand')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'brand'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Brand
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('variants')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'variants'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Variants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cross-sell')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'cross-sell'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Cross-Sell
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('up-sell')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'up-sell'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Up-Sell
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('related')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'related'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Related
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'categories' && (
            <ProductCategoryManager
              productId={product?.id || ''}
              categories={categories}
              productCategories={product?.categories || []}
              onAssignCategories={handleCategoriesUpdate as any}
              onRemoveCategory={handleCategoriesUpdate as any}
              onSetPrimaryCategory={handleCategoriesUpdate as any}
            />
          )}

          {activeTab === 'brand' && (
            <ProductBrandManager
              productId={product?.id || ''}
              brands={brands}
              selectedBrandId={product?.brandId}
              onBrandSelect={handleBrandUpdate as any}
            />
          )}

          {activeTab === 'variants' && (
            <ProductVariantRelationships
              productId={product?.id || ''}
              variants={product?.variants || []}
              onSetVariantParent={handleSetVariantParent}
            />
          )}

          {activeTab === 'cross-sell' && (
            <CrossSellManager
              productId={product?.id || ''}
              availableProducts={allProducts}
              crossSellProducts={product?.crossSellProducts || []}
              onAddCrossSell={handleAddCrossSell}
              onRemoveCrossSell={handleRemoveCrossSell}
              onReorderCrossSell={handleReorderCrossSell}
            />
          )}

          {activeTab === 'up-sell' && (
            <UpSellManager
              productId={product?.id || ''}
              availableProducts={allProducts}
              upSellProducts={product?.upSellProducts || []}
              onAddUpSell={handleAddUpSell}
              onRemoveUpSell={handleRemoveUpSell}
              onReorderUpSell={handleReorderUpSell}
            />
          )}

          {activeTab === 'related' && (
            <RelatedProductsManager
              productId={product?.id || ''}
              availableProducts={allProducts}
              relatedProducts={product?.relatedProducts || []}
              onAddRelated={handleAddRelated}
              onRemoveRelated={handleRemoveRelated}
              onReorderRelated={handleReorderRelated}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
