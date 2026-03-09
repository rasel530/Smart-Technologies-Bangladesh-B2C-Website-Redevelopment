import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // FIX: Skip middleware for login page and unauthorized page to prevent redirect loop
  if (pathname.startsWith('/login') || pathname.startsWith('/unauthorized')) {
    // Add cache control headers for login page to prevent caching
    if (pathname.startsWith('/login')) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    return NextResponse.next();
  }

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Get the session token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Check if user is authenticated
  if (!token) {
    console.log(`[Auth Middleware] Unauthenticated access attempt to: ${pathname}`);
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check if user has admin role
  // Handle both string and array formats for role
  const userRole = token.role;
  const userRoles = Array.isArray(userRole) ? userRole : [userRole];
  
  // Check if user has any admin role (admin or super_admin)
  const hasAdminRole = userRoles.some(role => 
    role === 'admin' || role === 'super_admin'
  );
  
  if (!hasAdminRole) {
    console.log(`[Auth Middleware] Non-admin user (${JSON.stringify(userRole)}) attempted access to: ${pathname}`);
    const url = new URL('/unauthorized', req.url);
    return NextResponse.redirect(url);
  }
  
  // User is authenticated and has admin role
  console.log(`[Auth Middleware] Admin user (${token.email}) accessing: ${pathname}`);
  
  // Add cache control headers to prevent caching of admin pages
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login/:path*'],
};
