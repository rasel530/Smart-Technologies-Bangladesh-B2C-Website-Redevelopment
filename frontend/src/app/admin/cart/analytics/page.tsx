'use client';

import React from 'react';
import CartAnalytics from '@/components/admin/cart/CartAnalytics';
import { withAuth } from '@/components/auth/withAuth';

function CartAnalyticsPage() {
  return <CartAnalytics />;
}

export default withAuth(CartAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
