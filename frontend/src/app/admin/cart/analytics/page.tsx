'use client';

import React from 'react';
import CartAnalyticsDashboard from '@/components/admin/cart/CartAnalyticsDashboard';
import { withAuth } from '@/components/auth/withAuth';

function CartAnalyticsPage() {
  return <CartAnalyticsDashboard />;
}

export default withAuth(CartAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
