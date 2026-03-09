'use client';

import CartWishlistSyncDashboard from '@/components/admin/cartWishlist/CartWishlistSyncDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function SyncDashboardPage() {
  return (
    <AdminLayout title="Cart & Wishlist Sync Dashboard">
      <CartWishlistSyncDashboard />
    </AdminLayout>
  );
}
