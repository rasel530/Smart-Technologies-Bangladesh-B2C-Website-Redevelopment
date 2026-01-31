/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled standalone output mode to avoid Windows symlink permission errors
  // Standalone mode will be enabled in Docker build if needed
  // output: 'standalone',
  // Completely disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'host.docker.internal', 'smarttech.com', 'api.smarttech.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'host.docker.internal',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'smarttech.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.smarttech.com',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: true,
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
    // Use environment variable for backend URL, fallback to localhost:3001 for local development
    // The backend service is accessible at http://backend:3000 within Docker network
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    
    return [
      // Keep NextAuth routes on frontend - do not proxy to backend
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Keep profile routes on frontend - do not proxy to backend (handled by custom route)
      {
        source: '/api/v1/profile/:path*',
        destination: '/api/v1/:path*',
      },
      // Proxy other /api/v1 routes to backend (excluding profile)
      {
        source: '/api/v1/:path((?!profile).)*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Proxy other /api/v1 routes to backend (excluding /api/auth and /api/v1)
      {
        source: '/api/v1/:path((?!auth|v1).)*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Note: /uploads routes are NOT proxied anymore
      // Images are served directly from backend with absolute URLs in database
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
