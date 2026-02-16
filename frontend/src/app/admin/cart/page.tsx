'use client';

import React from 'react';
import CartList from '@/components/admin/cart/CartList';
import { withAuth } from '@/components/auth/withAuth';

function CartManagementPage() {
  return <CartList />;
}

export default withAuth(CartManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
