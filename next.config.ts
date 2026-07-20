import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  return [
    { source: '/.well-known/:path*', destination: 'https://lawallet.blocks.ar/.well-known/:path*' },
  ]
};

export default nextConfig;
