import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    }, { status: 200 });

    // Clear access_token cookie
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    // Also clear refresh_token cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    logger.error('Admin logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
    }, { status: 500 });
  }
}
