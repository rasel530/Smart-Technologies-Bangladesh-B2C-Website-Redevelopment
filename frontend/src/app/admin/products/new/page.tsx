'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateProductRequest } from '@/types/product';
import ProductForm from '@/components/admin/ProductForm';
import ProductSpecificationEditor from '@/components/admin/ProductSpecificationEditor';
import ProductVariantEditor from '@/components/admin/ProductVariantEditor';
import SEOFieldEditor from '@/components/admin/SEOFieldEditor';
import productsApi from '@/lib/api/products';
import { ProductWithRelations } from '@/types/product';
import { withAuth } from '@/components/auth/withAuth';

function NewProductPage() {
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithRelations | undefined>(undefined);
  const [specifications, setSpecifications] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateProductRequest) => {
    setLoading(true);
    try {
      const createdProduct = await productsApi.create(data);
      // Now add specifications, variants, and images
      router.push(`/admin/products/${createdProduct.id}/edit`);
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Product</h1>

        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        <div className="mt-8 space-y-6">
          <ProductSpecificationEditor
            productId={product?.id || ''}
            specifications={specifications}
            onUpdate={() => {}}
          />

          <ProductVariantEditor
            productId={product?.id || ''}
            variants={variants}
            onUpdate={() => {}}
          />

          {product && (
            <SEOFieldEditor
              product={product}
              onUpdate={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(NewProductPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
