/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  env: {
    NODE_ENV: 'production'
  },
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    domains: [], // Add your image domains here
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, buildId }) => {
    // Production-specific webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Bundle analyzer (if ANALYZE=true)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer 
            ? '../analyze/server.html' 
            : './analyze/client.html'
        })
      )
    }
    
    return config
  },
  
  // Output configuration for production
  output: 'standalone',
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    }
  },
  
  // TypeScript configuration
  typescript: {
    // Allow build to continue with type errors in production
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration
  eslint: {
    // Allow build to continue with ESLint errors in production
    ignoreDuringBuilds: true,
  },
  
  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false,
      },
    ]
  },
  
  // Static file optimization
  trailingSlash: false,
  
  // Disable x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig