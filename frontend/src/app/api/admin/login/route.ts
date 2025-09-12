import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
      emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json();
    
    // Validation
    if (!body.username || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน'
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
      body: JSON.stringify({
        username: body.username,
        password: body.password
      })
    });

    const backendData = await backendResponse.json();

    // If backend request failed, return the error
    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      }, { status: backendResponse.status });
    }

    // Check if user has admin role
    if (backendData.data?.user?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล'
      }, { status: 403 });
    }

    // If backend request succeeded, return the data in backend format
    const response = NextResponse.json({
      data: backendData.data,
      statusCode: 200
    }, { status: 200 });

    // Set cookies if tokens are available (use access_token for consistency)
    if (backendData.data?.accessToken) {
      response.cookies.set('access_token', backendData.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
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
    logger.error('Admin login error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 });
  }
}
