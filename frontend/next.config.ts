import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Disable ESLint during builds to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // API routes configuration - selective proxy for backend routes
  async rewrites() {
    // Use BACKEND_URL for server-side requests (Docker internal networking)
    // Fall back to NEXT_PUBLIC_API_URL for client-side requests
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    return [
      // Proxy medical API routes to backend
      {
        source: '/api/medical/:path*',
        destination: `${backendUrl}/api/medical/:path*`,
      },
      // Proxy admin API routes to backend
      {
        source: '/api/admin/:path*',
        destination: `${backendUrl}/api/admin/:path*`,
      },
      // Proxy external-requesters API routes to backend
      {
        source: '/api/external-requesters/:path*',
        destination: `${backendUrl}/api/external-requesters/:path*`,
      },
      // Proxy consent API routes to backend
      {
        source: '/api/consent/:path*',
        destination: `${backendUrl}/api/consent/:path*`,
      },
      // Proxy AI API routes to backend
      {
        source: '/api/ai/:path*',
        destination: `${backendUrl}/api/ai/:path*`,
      },
      // Proxy appointments API routes to backend
      {
        source: '/api/appointments/:path*',
        destination: `${backendUrl}/api/appointments/:path*`,
      },
      // Proxy security API routes to backend
      {
        source: '/api/security/:path*',
        destination: `${backendUrl}/api/security/:path*`,
      },
      // Proxy health API routes to backend
      {
        source: '/api/health/:path*',
        destination: `${backendUrl}/api/health/:path*`,
      },
    ];
  },
  // Enable compression
  compress: true,
};

export default nextConfig;
