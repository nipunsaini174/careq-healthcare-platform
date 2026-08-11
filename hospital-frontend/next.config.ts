import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*', // Proxy to Backend (127.0.0.1 avoids IPv6 localhost issues on Windows)
      },
    ];
  },
};

export default nextConfig;
