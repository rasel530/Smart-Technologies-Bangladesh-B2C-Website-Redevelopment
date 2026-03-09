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
import { AdminLayout } from '@/components/admin/AdminLayout';

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
    <AdminLayout title="New Product">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Products
        </button>
      </div>

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
    </AdminLayout>
  );
}

export default withAuth(NewProductPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
