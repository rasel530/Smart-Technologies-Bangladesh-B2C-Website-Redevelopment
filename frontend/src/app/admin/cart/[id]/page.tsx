'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import CartDetail from '@/components/admin/cart/CartDetail';
import { withAuth } from '@/components/auth/withAuth';

function CartDetailPage() {
  const params = useParams();
  const cartId = params.id as string;

  return <CartDetail cartId={cartId} />;
}

export default withAuth(CartDetailPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
