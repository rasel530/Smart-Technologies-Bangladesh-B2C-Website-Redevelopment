/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'smarttech.com', 'api.smarttech.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async rewrites() {
    // In Docker, use the service name 'backend' instead of 'localhost'
    const backendUrl = process.env.IS_DOCKER === 'true'
      ? 'http://backend:3000'
      : 'http://localhost:3001';
    
    return [
      // Keep NextAuth routes on frontend - do not proxy to backend
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Proxy backend API routes - preserve full path including /api/v1/
      // This excludes /api/auth/* which is handled by NextAuth
      {
        source: '/api/:path((?!auth).)*',
        destination: `${backendUrl}/api/:path*`,
      },
      // Proxy static file uploads to avoid CORS issues
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  // Disable static generation for pages that have SSR issues
  experimental: {
    serverComponentsExternalPackages: ['@/components/auth/withAuth'],
  },
  // Skip static generation for pages with browser API dependencies
  output: 'standalone',
  // Disable static optimization to prevent build errors
  trailingSlash: false,
};

module.exports = nextConfig;
