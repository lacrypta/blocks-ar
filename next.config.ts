import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/.well-known/:path*', destination: 'https://lawallet.blocks.ar/.well-known/:path*' },
    ]
  }
};

export default nextConfig;
