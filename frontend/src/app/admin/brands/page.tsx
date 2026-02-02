'use client';

import React from 'react';
import BrandList from '@/components/admin/BrandList';
import { withAuth } from '@/components/auth/withAuth';

/**
 * Brands Admin Page
 * 
 * Main page for managing brands with:
 * - Brand list with search and filters
 * - Statistics section
 * - Navigation to create new brand
 */
function BrandsPage() {
  return <BrandList />;
}

export default withAuth(BrandsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
