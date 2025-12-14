
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
devIndicators: false,

  experimental: {

    serverActions: {
      bodySizeLimit: '500mb', // increase limit here
      allowedOrigins: ['*', '*.my-proxy.com'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        port: '',
        pathname: '/account123/**',
      },
    ],
  },
};

module.exports = nextConfig;
// OR: export default nextConfig;  (if using ESM instead of CJS)
