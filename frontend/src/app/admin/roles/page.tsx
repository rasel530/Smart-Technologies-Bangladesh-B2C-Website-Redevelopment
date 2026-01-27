'use client';

import RoleManagement from '@/components/account/RoleManagement';
import { withAuth } from '@/components/auth/withAuth';

function RolesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleManagement />
    </div>
  );
}

export default withAuth(RolesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
