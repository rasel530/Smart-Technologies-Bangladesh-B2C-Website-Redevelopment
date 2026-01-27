import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
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
  const userRole = token.role as string;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    console.log(`[Auth Middleware] Non-admin user (${userRole}) attempted access to: ${pathname}`);
    const url = new URL('/403', req.url);
    return NextResponse.redirect(url);
  }
  
  // User is authenticated and has admin role
  console.log(`[Auth Middleware] Admin user (${token.email}) accessing: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
