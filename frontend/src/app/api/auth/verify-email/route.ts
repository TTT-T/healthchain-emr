import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getBackendApiUrl } from '@/lib/backend-url';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { message: 'Token และ email จำเป็นต้องมี' },
        { status: 400 }
      );
    }

    // Call backend API to verify email
    const response = await fetch(getBackendApiUrl('/auth/verify-email'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email }),
    });

    const data = await response.json();

    if (response.ok) {
      logger.info('Email verification successful', { email });
      return NextResponse.json({
        message: 'ยืนยันอีเมลเรียบร้อยแล้ว',
        success: true
      });
    } else {
      logger.error('Email verification failed', { email, error: data.message });
      return NextResponse.json(
        { message: data.message || 'เกิดข้อผิดพลาดในการยืนยันอีเมล' },
        { status: response.status }
      );
    }
  } catch (error) {
    logger.error('Email verification API error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
