'use client';

import React from 'react';
import { CategoryTreeEditor } from '@/components/admin/CategoryTreeEditor';
import { withAuth } from '@/components/auth/withAuth';

/**
 * Category Tree Editor Page
 * 
 * Dedicated page for managing category hierarchy using drag-and-drop tree editor.
 * This page provides a focused interface for organizing and reordering categories.
 */
function CategoryTreePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Category Tree Editor</h1>
          <p className="text-gray-600 mt-2">
            Organize and manage your product category hierarchy with drag-and-drop
          </p>
        </div>

        {/* Category Tree Editor */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <CategoryTreeEditor />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CategoryTreePage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
