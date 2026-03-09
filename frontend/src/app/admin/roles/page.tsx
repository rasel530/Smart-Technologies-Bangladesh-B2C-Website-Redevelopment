'use client';

import RoleManagement from '@/components/account/RoleManagement';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

function RolesPage() {
  return (
    <AdminLayout title="Roles Management">
      <RoleManagement />
    </AdminLayout>
  );
}

export default withAuth(RolesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
