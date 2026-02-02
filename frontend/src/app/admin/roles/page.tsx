'use client';

import RoleManagement from '@/components/account/RoleManagement';
import { withAuth } from '@/components/auth/withAuth';

function RolesPage() {
  return <RoleManagement />;
}

export default withAuth(RolesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
