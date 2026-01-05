import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

interface WithAuthProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

interface AuthWrapperProps {
  user: User | null;
  isLoading: boolean;
}

const AuthWrapper: React.FC<AuthWrapperProps & WithAuthProps> = ({
  children,
  user,
  isLoading,
  requiredRole,
  fallback,
  redirectTo
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state
  if (isLoading || !mounted) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push('/login');
    }
    return fallback || null;
  }

  // Check role-based access
  if (requiredRole) {
    const userRole = user.role || 'user';
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(userRole)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push('/account')}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
            >
              Go to Account
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Higher-Order Component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: string | string[];
    fallback?: React.ReactNode;
    redirectTo?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();

    return (
      <AuthWrapper
        user={user}
        isLoading={isLoading}
        requiredRole={options.requiredRole}
        fallback={options.fallback}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </AuthWrapper>
    );
  };
}

// Hook for protected routes
export function useProtectedRoute(requiredRole?: string | string[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading || !mounted) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (requiredRole) {
      const userRole = user.role || 'user';
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(true);
    }
  }, [user, isLoading, requiredRole, router, mounted]);

  return {
    isAuthorized,
    user,
    isLoading,
  };
}

export default withAuth;