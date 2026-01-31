'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductList from '@/components/admin/ProductList';
import productsApi from '@/lib/api/products';
import { withAuth } from '@/components/auth/withAuth';

function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductList />
      </div>
    </div>
  );
}

export default withAuth(ProductsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
