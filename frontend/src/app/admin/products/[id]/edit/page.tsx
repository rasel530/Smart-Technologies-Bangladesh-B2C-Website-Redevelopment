'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductWithRelations, UpdateProductRequest } from '@/types/product';
import { Category } from '@/types/category';
import { Brand } from '@/types/brand';
import ProductForm from '@/components/admin/ProductForm';
import ProductSpecificationEditor from '@/components/admin/ProductSpecificationEditor';
import ProductVariantEditor from '@/components/admin/ProductVariantEditor';
import SEOFieldEditor from '@/components/admin/SEOFieldEditor';
import productsApi from '@/lib/api/products';
import categoriesApi from '@/lib/api/categories';
import brandsApi from '@/lib/api/brands';
import { withAuth } from '@/components/auth/withAuth';
import { ProductImage } from '@/types/product-image';
import { getImageUrl } from '@/lib/api/product-images';
import { AdminLayout } from '@/components/admin/AdminLayout';

function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithRelations | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string; sku: string; regularPrice: number; salePrice: number | null }>>([]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchCategories();
      fetchBrands();
      fetchAllProducts();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const productData = await productsApi.getById(params.id as string);
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories({ limit: 1000 });
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandsApi.getBrands({ limit: 1000 });
      setBrands(response.brands || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await productsApi.getAll({ limit: 1000 });
      setAllProducts(response.products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice
      })));
    } catch (error) {
      console.error('Error fetching all products:', error);
    }
  };

  const handleSubmit = async (data: UpdateProductRequest) => {
    if (!product) return;

    setSaving(true);
    try {
      await productsApi.update(product.id, data);
      alert('Product updated successfully');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading product...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Edit Product">
        <p className="text-red-600">Product not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Product">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Products
        </button>
      </div>

      {/* Image Management Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {product.images?.length || 0} Images
              </span>
            </div>
            {product.images && product.images.length > 0 && (
              <div className="flex items-center space-x-2">
                {product.images?.[0] && (
                  <img
                    src={getImageUrl(product.images[0], 'thumbnail')}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover border border-gray-300 dark:border-gray-600"
                  />
                )}
              </div>
            )}
          </div>
          <Link
            href={`/admin/products/${product.id}/images`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Manage Images
          </Link>
        </div>
      </div>

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        categories={categories}
        brands={brands}
        allProducts={allProducts}
      />

      <div className="mt-8 space-y-6">
        <ProductSpecificationEditor
          productId={product.id}
          specifications={product.specifications}
          onUpdate={fetchProduct}
        />

        <ProductVariantEditor
          productId={product.id}
          variants={product.variants}
          onUpdate={fetchProduct}
        />

        <SEOFieldEditor
          product={product}
          onUpdate={fetchProduct}
        />
      </div>
    </AdminLayout>
  );
}

export default withAuth(EditProductPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
