import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    }, { status: 200 });

    // Clear external requester cookie
    response.cookies.set('external-requester-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('External requester logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
    }, { status: 500 });
  }
}
