'use client';

import React from 'react';
import { withAuth } from '@/components/auth/withAuth';
import CheckoutSessionTable from '@/components/admin/checkout/CheckoutSessionTable';
import { ShoppingCart } from 'lucide-react';

/**
 * Admin Checkout Sessions Page
 * 
 * This page provides a comprehensive interface for managing checkout sessions.
 * Admins can view, filter, search, and manage all checkout sessions in the system.
 * 
 * Features:
 * - View all checkout sessions with pagination
 * - Filter by status (active, completed, abandoned, expired)
 * - Filter by user type (guest, authenticated)
 * - Filter by current step (cart, shipping, billing, payment, review, confirmation)
 * - Search by session ID or email
 * - View detailed session information
 * - Cancel active sessions
 * - Export session data to CSV
 * - Mobile-responsive design
 */
function AdminCheckoutSessionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <ShoppingCart className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout Sessions</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all checkout sessions in the system
          </p>
        </div>
      </div>

      {/* Sessions Table */}
      <CheckoutSessionTable />
    </div>
  );
}

// Wrap with authentication HOC
export default withAuth(AdminCheckoutSessionsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
