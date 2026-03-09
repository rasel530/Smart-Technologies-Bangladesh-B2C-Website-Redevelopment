'use client';

import MoveHistoryViewer from '@/components/admin/cartWishlist/MoveHistoryViewer';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function MoveHistoryPage() {
  return (
    <AdminLayout title="Cart & Wishlist Move History">
      <MoveHistoryViewer />
    </AdminLayout>
  );
}
