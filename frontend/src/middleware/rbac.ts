import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rbacApi } from '@/lib/api/rbac';

/**
 * RBAC Middleware
 * 
 * Provides middleware functions for protecting routes based on:
 * - Authentication
 * - Roles
 * - Permissions
 * - Role hierarchy levels
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Protect route with authentication check
 * @param allowedRoles - Optional array of allowed role names
 * @returns Middleware function
 */
export const withAuth = (allowedRoles?: string[]) => {
  return async (req: NextRequest) => {
    try {
      // Get JWT token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Check if authenticated
      if (!token || !token.id) {
        if (isDev) {
          console.log('[RBAC Middleware] No valid token found');
        }
        return redirectToLogin(req);
      }

      // If no role requirements, allow access
      if (!allowedRoles || allowedRoles.length === 0) {
        return NextResponse.next();
      }

      // Check if user has any of the allowed roles
      // Handle both string and array formats for role
      const userRole = token.role;
      const userRoles = Array.isArray(userRole) 
        ? userRole.map(r => r?.toLowerCase().trim()).filter(Boolean)
        : [userRole?.toLowerCase().trim()].filter(Boolean);
      
      const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

      if (isDev) {
        console.log('[RBAC Middleware] Role check:', { userRoles, allowedRoles: normalizedAllowedRoles });
      }

      // Check if user has any of the allowed roles
      const hasRequiredRole = userRoles.some(role => 
        role && normalizedAllowedRoles.includes(role)
      );

      if (!hasRequiredRole) {
        if (isDev) {
          console.log('[RBAC Middleware] User does not have required role');
        }
        return redirectToUnauthorized(req, 'You do not have required role to access this page.');
      }

      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isDev) {
        console.error('[RBAC Middleware] Error:', errorMessage);
      }
      return redirectToLogin(req);
    }
  };
};

/**
 * Protect route requiring specific permission
 * @param requiredPermission - Permission name (e.g., 'user:create')
 * @returns Middleware function
 */
export const withPermission = (requiredPermission: string) => {
  return async (req: NextRequest) => {
    try {
      // Get JWT token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Check if authenticated
      if (!token || !token.id) {
        if (isDev) {
          console.log('[RBAC Middleware] No valid token found');
        }
        return redirectToLogin(req);
      }

      // Check if user has required permission
      try {
        const response = await rbacApi.authCheck.hasPermission(requiredPermission);
        
        if (!response.hasPermission) {
          if (isDev) {
            console.log('[RBAC Middleware] User does not have required permission:', requiredPermission);
          }
          return redirectToUnauthorized(req, `You do not have required permission: ${requiredPermission}`);
        }
      } catch (apiError) {
        console.error('[RBAC Middleware] Error checking permission:', apiError);
        return redirectToUnauthorized(req, 'Error checking permissions. Please try again.');
      }

      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isDev) {
        console.error('[RBAC Middleware] Error:', errorMessage);
      }
      return redirectToLogin(req);
    }
  };
};

/**
 * Protect route requiring minimum role level
 * @param minLevel - Minimum hierarchy level required
 * @returns Middleware function
 */
export const withMinimumRoleLevel = (minLevel: number) => {
  return async (req: NextRequest) => {
    try {
      // Get JWT token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Check if authenticated
      if (!token || !token.id) {
        if (isDev) {
          console.log('[RBAC Middleware] No valid token found');
        }
        return redirectToLogin(req);
      }

      // Check if user meets minimum role level
      try {
        const response = await rbacApi.authCheck.getRoleLevel();
        
        if ((response.roleLevel || 0) < minLevel) {
          if (isDev) {
            console.log('[RBAC Middleware] User does not meet minimum role level:', {
              userLevel: response.roleLevel,
              requiredLevel: minLevel,
            });
          }
          return redirectToUnauthorized(req, `You do not have required role level to access this page.`);
        }
      } catch (apiError) {
        console.error('[RBAC Middleware] Error checking role level:', apiError);
        return redirectToUnauthorized(req, 'Error checking role level. Please try again.');
      }

      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isDev) {
        console.error('[RBAC Middleware] Error:', errorMessage);
      }
      return redirectToLogin(req);
    }
  };
};

/**
 * Protect route requiring admin role
 * @returns Middleware function
 */
export const withAdmin = () => {
  return withAuth(['admin', 'super_admin']);
};

/**
 * Protect route requiring super admin role
 * @returns Middleware function
 */
export const withSuperAdmin = () => {
  return withAuth(['super_admin']);
};

/**
 * Protect route requiring support access
 * @returns Middleware function
 */
export const withSupportAccess = () => {
  return withAuth(['support', 'admin', 'super_admin']);
};

/**
 * Protect route requiring corporate access
 * @returns Middleware function
 */
export const withCorporateAccess = () => {
  return withAuth(['corporate', 'admin', 'super_admin']);
};

/**
 * Protect route requiring multiple permissions (any)
 * @param permissions - Array of permission names
 * @returns Middleware function
 */
export const withAnyPermission = (permissions: string[]) => {
  return async (req: NextRequest) => {
    try {
      // Get JWT token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Check if authenticated
      if (!token || !token.id) {
        if (isDev) {
          console.log('[RBAC Middleware] No valid token found');
        }
        return redirectToLogin(req);
      }

      // Check if user has any of required permissions
      try {
        const response = await rbacApi.authCheck.checkPermissions(permissions, 'any');
        
        if (!response.hasPermissions) {
          if (isDev) {
            console.log('[RBAC Middleware] User does not have any of the required permissions:', permissions);
          }
          return redirectToUnauthorized(req, `You do not have required permissions to access this page.`);
        }
      } catch (apiError) {
        console.error('[RBAC Middleware] Error checking permissions:', apiError);
        return redirectToUnauthorized(req, 'Error checking permissions. Please try again.');
      }

      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isDev) {
        console.error('[RBAC Middleware] Error:', errorMessage);
      }
      return redirectToLogin(req);
    }
  };
};

/**
 * Protect route requiring multiple permissions (all)
 * @param permissions - Array of permission names
 * @returns Middleware function
 */
export const withAllPermissions = (permissions: string[]) => {
  return async (req: NextRequest) => {
    try {
      // Get JWT token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Check if authenticated
      if (!token || !token.id) {
        if (isDev) {
          console.log('[RBAC Middleware] No valid token found');
        }
        return redirectToLogin(req);
      }

      // Check if user has all of required permissions
      try {
        const response = await rbacApi.authCheck.checkPermissions(permissions, 'all');
        
        if (!response.hasPermissions) {
          if (isDev) {
            console.log('[RBAC Middleware] User does not have all of the required permissions:', permissions);
          }
          return redirectToUnauthorized(req, `You do not have all of the required permissions to access this page.`);
        }
      } catch (apiError) {
        console.error('[RBAC Middleware] Error checking permissions:', apiError);
        return redirectToUnauthorized(req, 'Error checking permissions. Please try again.');
      }

      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isDev) {
        console.error('[RBAC Middleware] Error:', errorMessage);
      }
      return redirectToLogin(req);
    }
  };
};

/**
 * Redirect to login page
 */
const redirectToLogin = (req: NextRequest) => {
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
};

/**
 * Redirect to unauthorized page
 */
const redirectToUnauthorized = (req: NextRequest, message?: string) => {
  const unauthorizedUrl = new URL('/unauthorized', req.url);
  if (message) {
    unauthorizedUrl.searchParams.set('message', message);
  }
  return NextResponse.redirect(unauthorizedUrl);
};

/**
 * Client-side RBAC hooks
 * 
 * These are meant to be used in React components for conditional rendering.
 * They should be imported and used in components, not as middleware.
 */

import { useEffect, useState } from 'react';
import {
  userHasPermission as checkPermission,
  userHasRole as checkRole,
  userHasAnyPermission as checkAnyPermission,
  userHasAllPermissions as checkAllPermissions,
  userHasMinimumRoleLevel as checkMinRoleLevel,
} from '@/lib/rbac/utils';

/**
 * Hook to check if user has permission
 */
export const useHasPermission = (permission: string) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkPermission(permission);
      setHasPermission(result);
      setLoading(false);
    };
    check();
  }, [permission]);

  return { hasPermission, loading };
};

/**
 * Hook to check if user has role
 */
export const useHasRole = (role: string) => {
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkRole(role);
      setHasRole(result);
      setLoading(false);
    };
    check();
  }, [role]);

  return { hasRole, loading };
};

/**
 * Hook to check if user has any of specified permissions
 */
export const useHasAnyPermission = (permissions: string[]) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkAnyPermission(permissions);
      setHasPermission(result);
      setLoading(false);
    };
    check();
  }, [permissions]);

  return { hasPermission, loading };
};

/**
 * Hook to check if user has all of specified permissions
 */
export const useHasAllPermissions = (permissions: string[]) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkAllPermissions(permissions);
      setHasPermission(result);
      setLoading(false);
    };
    check();
  }, [permissions]);

  return { hasPermission, loading };
};

/**
 * Hook to check if user meets minimum role level
 */
export const useHasMinimumRoleLevel = (level: number) => {
  const [hasLevel, setHasLevel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkMinRoleLevel(level);
      setHasLevel(result);
      setLoading(false);
    };
    check();
  }, [level]);

  return { hasLevel, loading };
};

// Export all middleware functions and hooks
export default {
  withAuth,
  withPermission,
  withMinimumRoleLevel,
  withAdmin,
  withSuperAdmin,
  withSupportAccess,
  withCorporateAccess,
  withAnyPermission,
  withAllPermissions,
  useHasPermission,
  useHasRole,
  useHasAnyPermission,
  useHasAllPermissions,
  useHasMinimumRoleLevel,
};
