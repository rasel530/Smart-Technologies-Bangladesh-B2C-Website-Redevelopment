'use client';

import React from 'react';
import CartAnalyticsDashboard from '@/components/admin/cart/CartAnalyticsDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';

function CartAnalyticsPage() {
  return <CartAnalyticsDashboard />;
}

function CartAnalyticsPageWithLayout() {
  return (
    <AdminLayout title="Cart Analytics">
      <CartAnalyticsPage />
    </AdminLayout>
  );
}

export default withAuth(CartAnalyticsPageWithLayout, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
