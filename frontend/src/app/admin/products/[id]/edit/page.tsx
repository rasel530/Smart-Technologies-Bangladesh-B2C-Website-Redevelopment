'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductWithRelations, UpdateProductRequest } from '@/types/product';
import { Category } from '@/types/category';
import { Brand } from '@/types/brand';
import ProductForm from '@/components/admin/ProductForm';
import ProductSpecificationEditor from '@/components/admin/ProductSpecificationEditor';
import ProductVariantEditor from '@/components/admin/ProductVariantEditor';
import ProductImageUploader from '@/components/admin/ProductImageUploader';
import SEOFieldEditor from '@/components/admin/SEOFieldEditor';
import productsApi from '@/lib/api/products';
import categoriesApi from '@/lib/api/categories';
import brandsApi from '@/lib/api/brands';
import { withAuth } from '@/components/auth/withAuth';

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Products
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Product: {product.name}</h1>

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

          <ProductImageUploader
            productId={product.id}
            images={product.images}
            onUpdate={fetchProduct}
          />

          <SEOFieldEditor
            product={product}
            onUpdate={fetchProduct}
          />
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditProductPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
