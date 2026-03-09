'use client';

import CartWishlistAnalytics from '@/components/admin/cartWishlist/CartWishlistAnalytics';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AnalyticsPage() {
  return (
    <AdminLayout title="Cart & Wishlist Analytics">
      <CartWishlistAnalytics />
    </AdminLayout>
  );
}
