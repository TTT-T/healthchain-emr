import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface AuthLoginRequest {
  username?: string;
  email?: string;
  password: string;
}

interface AuthLoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
      emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
    requiresProfileSetup?: boolean;
    redirectTo?: string;
  };
  metadata?: {
    requiresEmailVerification?: boolean;
    email?: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthLoginRequest = await request.json();
    
    // Validation
    if ((!body.username && !body.email) || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุชื่อผู้ใช้หรืออีเมลและรหัสผ่าน'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
      },
      body: JSON.stringify(body)
    });

    const backendData = await backendResponse.json();

    // If backend request failed, return the error
    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        metadata: backendData.metadata
      }, { status: backendResponse.status });
    }

    // If backend request succeeded, return the data
    const response = NextResponse.json({
      success: true,
      message: backendData.message || 'เข้าสู่ระบบสำเร็จ',
      data: backendData.data,
      metadata: backendData.metadata
    }, { status: 200 });

    // Set cookies if tokens are available
    if (backendData.data?.accessToken) {
      response.cookies.set('access_token', backendData.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 // 1 hour
      });
    }

    if (backendData.data?.refreshToken) {
      response.cookies.set('refresh_token', backendData.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
    }

    return response;

  } catch (error) {
    logger.error('Auth login error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 });
  }
}
