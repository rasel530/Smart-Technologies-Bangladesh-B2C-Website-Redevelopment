'use client';

import SyncConflictResolver from '@/components/admin/cartWishlist/SyncConflictResolver';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function ConflictsPage() {
  return (
    <AdminLayout title="Cart & Wishlist Conflicts">
      <SyncConflictResolver />
    </AdminLayout>
  );
}
