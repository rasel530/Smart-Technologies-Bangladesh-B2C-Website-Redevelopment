'use client';

import React from 'react';
import CartList from '@/components/admin/cart/CartList';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';

function CartManagementPage() {
  return <CartList />;
}

function CartManagementPageWithLayout() {
  return (
    <AdminLayout title="Cart Management">
      <CartManagementPage />
    </AdminLayout>
  );
}

export default withAuth(CartManagementPageWithLayout, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
