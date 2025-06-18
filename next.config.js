/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
    ],
  },
}

module.exports = nextConfig