import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Enable standalone output for Docker builds
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
