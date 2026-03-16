import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'shiki'],
  },
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/team', destination: '/about', permanent: true },
      { source: '/our-team', destination: '/about', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/contactus', destination: '/contact', permanent: true },
      { source: '/media', destination: '/press', permanent: true },
      { source: '/.well-known/llms.txt', destination: '/llms.txt', permanent: true },
      { source: '/.well-known/llms-full.txt', destination: '/llms-full.txt', permanent: true },
    ]
  },
}

export default nextConfig
