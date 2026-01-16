'use client';

import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Key, 
  ArrowUp,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';

/**
 * RBAC Dashboard Page
 * 
 * Main dashboard for RBAC management.
 * Provides navigation to all RBAC admin pages.
 */
export default function RBACDashboardPage() {
  const rbacSections = [
    {
      title: 'Role Management',
      description: 'Create, edit, and manage system roles',
      icon: Shield,
      href: '/admin/rbac/roles',
      color: 'blue',
    },
    {
      title: 'User Role Management',
      description: 'Assign and manage user roles',
      icon: Users,
      href: '/admin/rbac/users',
      color: 'green',
    },
    {
      title: 'Permission Management',
      description: 'Create, edit, and manage system permissions',
      icon: Key,
      href: '/admin/rbac/permissions',
      color: 'purple',
    },
    {
      title: 'Role Escalation Requests',
      description: 'Review and approve role escalation requests',
      icon: ArrowUp,
      href: '/admin/rbac/escalations',
      color: 'yellow',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <LayoutDashboard className="w-8 h-8 mr-3" />
            RBAC Management
          </h1>
          <p className="text-gray-600 mt-1">
            Role-Based Access Control Administration
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Welcome to RBAC Management
        </h2>
        <p className="text-gray-700 mb-4">
          Manage roles, permissions, and user access through this dashboard. Use the sections below to:
        </p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Create and manage system roles with hierarchy levels</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Assign and remove roles from users</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Configure permissions for each role</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Review and approve role escalation requests</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Monitor access control across the system</span>
          </li>
        </ul>
      </div>

      {/* RBAC Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rbacSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`group bg-white border rounded-lg p-6 hover:shadow-lg transition-all ${getColorClasses(
                section.color
              )}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getColorClasses(section.color).split(
                  ' '
                )[0]
                }`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Role Hierarchy</h4>
            <p className="text-sm text-gray-600">
              Roles are organized in a hierarchy from Customer (Level 20) to Super Admin (Level 100). Higher-level roles can assign lower-level roles.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Permission System</h4>
            <p className="text-sm text-gray-600">
              Permissions are organized by resource (e.g., user, product, order) and action (e.g., read, create, update, delete). Each role can have multiple permissions.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Escalation Workflow</h4>
            <p className="text-sm text-gray-600">
              Users can request role escalation through the escalation system. Admins must review and approve or reject these requests.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Audit Trail</h4>
            <p className="text-sm text-gray-600">
              All role changes and permission assignments are logged for audit purposes. Track who changed what and when.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Security Notice
        </h3>
        <ul className="space-y-2 text-yellow-800">
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>Only Super Admins can delete system roles</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>Users cannot assign roles at or above their own level</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>Users cannot assign or remove their own roles</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>Role escalation requires admin approval</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>All role changes are logged for audit purposes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
