import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Remove basePath since we're now using separate domains
  // basePath: '/developer',
  // assetPrefix: '/developer',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [],
  
  // Add runtime configuration
  env: {
    // Build-time environment variables
  },
  
  // Configure rewrites to handle API routes properly
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // Handle API health check - important for ALB health checks
        {
          source: '/api/health',
          destination: '/api/health',
        },
      ],
      fallback: [],
    };
  },
  
  // Handle trailing slashes consistently
  trailingSlash: false,
  
  // Optimize for production (swcMinify is deprecated in Next.js 15+)
  // swcMinify: true,
  
  // Configure headers for better performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
