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
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BrandList />
      </div>
    </div>
  );
}

export default withAuth(BrandsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
