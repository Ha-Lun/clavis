/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
