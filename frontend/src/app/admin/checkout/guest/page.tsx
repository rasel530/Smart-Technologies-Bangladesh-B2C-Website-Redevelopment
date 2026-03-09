'use client';

import React from 'react';
import { withAuth } from '@/components/auth/withAuth';
import GuestCheckoutTable from '@/components/admin/checkout/GuestCheckoutTable';
import { Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin Guest Checkout Page
 * 
 * This page provides a comprehensive interface for managing guest checkout sessions.
 * Admins can view, filter, search, and convert guest sessions to user accounts.
 * 
 * Features:
 * - View all guest checkout sessions with pagination
 * - Track guest conversion rate
 * - Monitor guest-to-user conversion analytics
 * - Filter by status (active, completed, abandoned, expired)
 * - Filter by conversion status (converted, not converted)
 * - Search by email, phone, or session ID
 * - View detailed guest session information
 * - Convert guest sessions to user accounts
 * - Export guest session data to CSV
 * - Mobile-responsive design
 */
function AdminGuestCheckoutPage() {
  return (
    <AdminLayout title="Guest Checkout Sessions">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guest Checkout Sessions</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage guest checkout sessions and conversions
            </p>
          </div>
        </div>

        {/* Guest Sessions Table */}
        <GuestCheckoutTable />
      </div>
    </AdminLayout>
  );
}

// Wrap with authentication HOC
export default withAuth(AdminGuestCheckoutPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
