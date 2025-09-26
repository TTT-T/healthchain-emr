import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from request body or cookies
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken || request.cookies.get('refresh_token')?.value;

    // Forward logout request to backend if refresh token is available
    if (refreshToken) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
            'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (backendError) {
        logger.error('Backend logout error:', backendError);
        // Continue with frontend logout even if backend fails
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    }, { status: 200 });

    // Clear cookies
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    logger.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
    }, { status: 500 });
  }
}
