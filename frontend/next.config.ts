import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Enable runtime environment variable access
    serverComponentsExternalPackages: [],
  },
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
