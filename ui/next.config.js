/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://jamesgurney.com',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
