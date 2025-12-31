import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from '@/lib/api/client';

// Define protected routes
const protectedRoutes = [
  '/account',
  '/dashboard',
  '/profile',
  '/orders',
  '/wishlist',
  '/cart',
];

// Define public routes that should not redirect to login
const publicRoutes = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-phone',
  '/forgot-password',
  '/reset-password',
];

// Role-based access control
const roleBasedRoutes = {
  '/admin': ['admin'],
  '/seller': ['seller', 'admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value || getToken();

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing public route with token, redirect to account
  if (isPublicRoute && token && pathname !== '/verify-email' && pathname !== '/verify-phone') {
    const accountUrl = new URL('/account', request.url);
    return NextResponse.redirect(accountUrl);
  }

  // Role-based access control
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route) && token) {
      try {
        // Verify token and get user role
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const userRole = userData.data?.role;

          if (!allowedRoles.includes(userRole)) {
            // Redirect to unauthorized page or account
            const unauthorizedUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(unauthorizedUrl);
          }
        } else {
          // Token is invalid, redirect to login
          const loginUrl = new URL('/login', request.url);
          return NextResponse.redirect(loginUrl);
        }
      } catch (error) {
        console.error('Middleware auth error:', error);
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};