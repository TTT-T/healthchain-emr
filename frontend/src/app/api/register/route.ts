import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Interface สำหรับข้อมูลที่รับจาก frontend
interface RegisterData {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  idCard: string;
  titlePrefix: string; // ถ้าเลือก "อื่นๆ" จะเป็นค่าจาก customTitle
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string
  gender: string;
  phone: string;
  userType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    
    // Validation
    if (!body.email || !body.password || !body.idCard) {
      return NextResponse.json(
        { error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า email ตรงกันหรือไม่
    if (body.email !== body.confirmEmail) {
      return NextResponse.json(
        { error: 'อีเมลไม่ตรงกัน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า password ตรงกันหรือไม่
    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ตรงกัน' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลสำหรับส่งไปยัง backend
    const userData = {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phone,
      role: 'patient' // Default role for registration
    };

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
      },
      body: JSON.stringify(userData)
    });

    const backendData = await backendResponse.json();

    // If backend request failed, return the error
    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี',
        error: backendData.message
      }, { status: backendResponse.status });
    }

    // If backend request succeeded, return the data
    const response = NextResponse.json({
      success: true,
      message: backendData.message || 'สร้างบัญชีสำเร็จ',
      data: backendData.data
    }, { status: 201 });

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
    logger.error('Registration error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
