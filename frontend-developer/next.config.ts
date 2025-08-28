import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/developer',
  assetPrefix: '/developer',
  eslint: {
    ignoreDuringBuilds: true,  // Skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true,    // Skip TypeScript checks during build
  },
  serverExternalPackages: [],
  // Add runtime configuration for environment variables
  env: {
    // Build-time environment variables (if any)
  },
  // Runtime configuration function
  async rewrites() {
    return [
      {
        source: '/api/runtime-config',
        destination: '/api/runtime-config',
      },
    ];
  },
};

export default nextConfig;
