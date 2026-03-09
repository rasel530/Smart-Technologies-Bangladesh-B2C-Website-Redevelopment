'use client';

import React from 'react';
import BrandList from '@/components/admin/BrandList';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Brands Admin Page
 * 
 * Main page for managing brands with:
 * - Brand list with search and filters
 * - Statistics section
 * - Navigation to create new brand
 */
function BrandsPage() {
  return (
    <AdminLayout title="Brand Management">
      <BrandList />
    </AdminLayout>
  );
}

export default withAuth(BrandsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
