'use client';

import { useParams } from 'next/navigation';
import UserBehaviorTracker from '@/components/admin/cartWishlist/UserBehaviorTracker';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { useEffect } from 'react';

export default function UserBehaviorPage() {
  const params = useParams();
  const { fetchUserBehavior } = useAdminCartWishlistStore();

  useEffect(() => {
    if (params.userId) {
      const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
      fetchUserBehavior(userId);
    }
  }, [params.userId]);

  return <UserBehaviorTracker />;
}
