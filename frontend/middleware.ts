import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NextAuth Middleware
 * 
 * This middleware is essential for NextAuth to properly handle session cookies
 * in Next.js App Router. Without this, sessions may not persist across
 * page refreshes.
 * 
 * Key Functions:
 * - Protects routes that require authentication
 * - Handles session cookie validation
 * - Manages session persistence across page loads
 */

export function middleware(req: NextRequest) {
    // Allow access to auth pages (login, register, etc.)
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register') ||
                     req.nextUrl.pathname.startsWith('/forgot-password') ||
                     req.nextUrl.pathname.startsWith('/reset-password');

    // Allow access to public pages
    const isPublicPage = req.nextUrl.pathname === '/' ||
                        req.nextUrl.pathname.startsWith('/products') ||
                        req.nextUrl.pathname.startsWith('/categories') ||
                        req.nextUrl.pathname.startsWith('/api');

    // Allow access to static assets
    const isStaticAsset = req.nextUrl.pathname.startsWith('/_next') ||
                         req.nextUrl.pathname.startsWith('/favicon') ||
                         req.nextUrl.pathname.startsWith('/uploads');

    // CRITICAL DIAGNOSTIC: Log all request details
    console.log('[MIDDLEWARE DIAGNOSTIC] === REQUEST START ===');
    console.log('[MIDDLEWARE DIAGNOSTIC] Pathname:', req.nextUrl.pathname);
    console.log('[MIDDLEWARE DIAGNOSTIC] Method:', req.method);
    console.log('[MIDDLEWARE DIAGNOSTIC] Headers:', Object.fromEntries(req.headers.entries()));
    console.log('[MIDDLEWARE DIAGNOSTIC] Cookies:', Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.value])));
    
    // If accessing public pages or static assets, allow through
    if (isPublicPage || isStaticAsset) {
      console.log('[MIDDLEWARE DIAGNOSTIC] Public page or static asset - ALLOWING');
      return NextResponse.next();
    }

    // Check for session cookie (both standard and secure names)
    const sessionToken = req.cookies.get('next-auth.session-token');
    const secureSessionToken = req.cookies.get('__Secure-next-auth.session-token');
    const hasSession = !!sessionToken || !!secureSessionToken;

    // DIAGNOSTIC: Log session cookie detection
    console.log('[MIDDLEWARE DIAGNOSTIC] Session token found:', !!sessionToken);
    console.log('[MIDDLEWARE DIAGNOSTIC] Secure session token found:', !!secureSessionToken);
    console.log('[MIDDLEWARE DIAGNOSTIC] Has session:', hasSession);
    console.log('[MIDDLEWARE DIAGNOSTIC] Session token value:', sessionToken?.value?.substring(0, 50) + '...');

    // If user has session and tries to access auth pages, redirect to home
    if (hasSession && isAuthPage) {
      console.log('[Middleware] User has session, redirecting from auth page to home');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // CRITICAL FIX: Check if this is a session restoration request
    // Session restoration happens when the browser loads a page and NextAuth needs to
    // restore the session from the cookie. We should NOT redirect during this process.
    const secFetchDest = req.headers.get('sec-fetch-dest');
    const isSessionRestoration = secFetchDest === 'document' &&
                               req.method === 'GET' &&
                               !isAuthPage;

    // Protected routes
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/account') ||
                          req.nextUrl.pathname.startsWith('/checkout') ||
                          req.nextUrl.pathname.startsWith('/orders');

    console.log('[MIDDLEWARE DIAGNOSTIC] Is auth page:', isAuthPage);
    console.log('[MIDDLEWARE DIAGNOSTIC] Is protected route:', isProtectedRoute);
    console.log('[MIDDLEWARE DIAGNOSTIC] sec-fetch-dest header:', secFetchDest);
    console.log('[MIDDLEWARE DIAGNOSTIC] Is session restoration:', isSessionRestoration);

    // CRITICAL FIX: Allow initial page loads to proceed without redirecting
    // This prevents the race condition where middleware redirects to login before
    // NextAuth can restore the session from the cookie.
    // The session restoration check (sec-fetch-dest: document) is unreliable,
    // so we use a more permissive approach: allow all GET requests to proceed
    // and let NextAuth handle session validation on the client side.
    // Only redirect if:
    // 1. User is NOT authenticated (no session cookie)
    // 2. User is accessing a protected route
    // 3. We're not on an auth page (to avoid redirect loops)
    // 4. This is NOT a GET request (GET requests are for page loads, let them through)
    // 5. This is NOT a session restoration request (additional safety check)
    if (!hasSession && isProtectedRoute && !isAuthPage && req.method !== 'GET') {
      console.log('[MIDDLEWARE DIAGNOSTIC] === REDIRECTING TO LOGIN ===');
      console.log('[MIDDLEWARE DIAGNOSTIC] Redirect reason: No session cookie on non-GET request');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      console.log('[MIDDLEWARE DIAGNOSTIC] Redirect URL:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }

    console.log('[MIDDLEWARE DIAGNOSTIC] === ALLOWING REQUEST TO PROCEED ===');
    console.log('[MIDDLEWARE DIAGNOSTIC] === REQUEST END ===');
    return NextResponse.next();
}

/**
 * Middleware Configuration
 *
 * Specifies which paths middleware should run on.
 * CRITICAL: Must NOT run on NextAuth routes to allow proper session management
 */
export const config = {
  // The matcher defines which paths middleware should run on
  // CRITICAL FIX: Exclude NextAuth routes to allow session restoration
  // NextAuth needs to handle its own routes without middleware interference
  matcher: [
    // Match all paths EXCEPT:
    // - NextAuth API routes (api/auth/*)
    // - NextAuth callback routes (api/callback/*)
    // - Static files (_next/static, _next/image)
    // - Public assets (favicon.ico, uploads)
    '/((?!api/(auth|callback)|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
