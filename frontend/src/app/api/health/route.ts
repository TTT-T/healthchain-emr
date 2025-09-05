import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if the application is running
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'Error',
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(healthCheck, { status: 503 });
  }
}
