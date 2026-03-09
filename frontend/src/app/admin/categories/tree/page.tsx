'use client';

import React from 'react';
import { CategoryTreeEditor } from '@/components/admin/CategoryTreeEditor';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Category Tree Editor Page
 * 
 * Dedicated page for managing category hierarchy using drag-and-drop tree editor.
 * This page provides a focused interface for organizing and reordering categories.
 */
function CategoryTreePage() {
  return (
    <AdminLayout title="Category Tree" description="Organize and manage your product category hierarchy with drag-and-drop">
      {/* Category Tree Editor */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <CategoryTreeEditor />
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(CategoryTreePage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
