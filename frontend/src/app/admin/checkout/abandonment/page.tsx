'use client';

import React from 'react';
import { withAuth } from '@/components/auth/withAuth';
import CheckoutAbandonmentTable from '@/components/admin/checkout/CheckoutAbandonmentTable';
import { AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin Checkout Abandonment Page
 * 
 * This page provides a comprehensive interface for managing abandoned checkout sessions.
 * Admins can view, filter, search, and send recovery emails for abandoned checkouts.
 * 
 * Features:
 * - View all abandoned checkout sessions with pagination
 * - Filter by abandonment step (cart, shipping, billing, payment, review, confirmation)
 * - Filter by recovery status (recovered, not recovered)
 * - Search by abandonment reason
 * - View detailed abandonment information
 * - Send recovery emails to customers
 * - Track recovery attempts
 * - Export abandonment data to CSV
 * - Mobile-responsive design
 */
function AdminCheckoutAbandonmentPage() {
  return (
    <AdminLayout title="Abandoned Checkouts">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Abandoned Checkouts</h1>
            <p className="text-gray-600 mt-1">
              Monitor and recover abandoned checkout sessions
            </p>
          </div>
        </div>

        {/* Abandonment Table */}
        <CheckoutAbandonmentTable />
      </div>
    </AdminLayout>
  );
}

// Wrap with authentication HOC
export default withAuth(AdminCheckoutAbandonmentPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
