'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductList from '@/components/admin/ProductList';
import productsApi from '@/lib/api/products';
import { withAuth } from '@/components/auth/withAuth';

function ProductsPage() {
  return <ProductList />;
}

export default withAuth(ProductsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
