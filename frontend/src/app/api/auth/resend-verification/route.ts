import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณาระบุอีเมล'
        },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://host.docker.internal:3001/api';
    const cleanBackendUrl = backendUrl.replace('/api', '');
    const response = await fetch(`${cleanBackendUrl}/api/auth/resend-email-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error?.message || 'ไม่สามารถส่งอีเมลยืนยันใหม่ได้'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่'
      },
      { status: 500 }
    );
  }
}
