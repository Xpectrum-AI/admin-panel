import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
