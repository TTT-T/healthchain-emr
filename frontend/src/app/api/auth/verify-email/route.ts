import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'ไม่พบโทเค็นการยืนยัน'
        },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const cleanBackendUrl = backendUrl.replace('/api', '');
    
    console.log('🔧 Frontend API Route - Backend URL:', cleanBackendUrl);
    console.log('🔧 Sending verification request with token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${cleanBackendUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email })
    });

    const data = await response.json();
    console.log('🔧 Backend response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      // Backend error response format: { data: null, error: { message: "..." } }
      const errorMessage = data.error?.message || data.message || 'ไม่สามารถยืนยันอีเมลได้';
      console.error('❌ Backend error:', errorMessage);
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage
        },
        { status: response.status }
      );
    }

    // Backend success response format: { data: {...}, error: null }
    return NextResponse.json({
      success: true,
      message: 'ยืนยันอีเมลเรียบร้อยแล้ว',
      data: data.data
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการยืนยันอีเมล'
      },
      { status: 500 }
    );
  }
}