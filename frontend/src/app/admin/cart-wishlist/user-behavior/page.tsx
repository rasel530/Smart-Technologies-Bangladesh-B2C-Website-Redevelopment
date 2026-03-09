'use client';

import UserBehaviorTracker from '@/components/admin/cartWishlist/UserBehaviorTracker';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function UserBehaviorPage() {
  return (
    <AdminLayout title="Cart & Wishlist User Behavior">
      <UserBehaviorTracker />
    </AdminLayout>
  );
}
