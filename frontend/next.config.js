/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled standalone output mode to avoid Windows symlink permission errors
  // Standalone mode will be enabled in Docker build if needed
  // output: 'standalone',
  images: {
    domains: ['localhost', 'smarttech.com', 'api.smarttech.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  // Optimize file watching for Docker environment
  webpack: (config, { isServer }) => {
    // Reduce file system overhead in Docker
    config.watchOptions = {
      poll: 3000, // Check for changes every 3 seconds (less aggressive)
      aggregateTimeout: 600, // Longer delay before rebuilding
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/dist/**',
        '**/[provider]/**', // Exclude dynamic route from watching
      ],
    };
    return config;
  },
  async rewrites() {
    // Always use Docker network URL since we're running in Docker
    // The backend service is accessible at http://backend:3000 within the Docker network
    const backendUrl = 'http://backend:3000';
    
    return [
      // Keep NextAuth routes on frontend - do not proxy to backend
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Keep profile routes on frontend - do not proxy to backend (handled by custom route)
      {
        source: '/api/v1/profile/:path*',
        destination: '/api/v1/profile/:path*',
      },
      // Proxy other /api/v1 routes to backend (excluding profile)
      {
        source: '/api/v1/:path((?!profile).)*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Proxy other backend API routes (excluding /api/auth and /api/v1)
      {
        source: '/api/:path((?!auth|v1).)*',
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
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip static generation for pages with browser API dependencies
  // Disable static optimization to prevent build errors
  trailingSlash: false,
  // Explicitly configure middleware for production
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
