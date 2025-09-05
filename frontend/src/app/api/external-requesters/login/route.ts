import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    organizationName: string;
    organizationType: string;
    status: string;
    dataAccessLevel: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุอีเมลและรหัสผ่าน'
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง'
      }, { status: 400 });
    }

    // จำลองการตรวจสอบข้อมูลจากฐานข้อมูล
    // ในระบบจริงจะต้องเช็คกับฐานข้อมูล external_requesters
    // const user = await db.external_requesters.findUnique({
    //   where: { login_email: body.email }
    // });
    
    // if (!user) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'ไม่พบผู้ใช้งาน'
    //   }, { status: 401 });
    // }

    // const isPasswordValid = await bcrypt.compare(body.password, user.password_hash);
    // if (!isPasswordValid) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'รหัสผ่านไม่ถูกต้อง'
    //   }, { status: 401 });
    // }

    // if (user.status !== 'approved') {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ'
    //   }, { status: 403 });
    // }

    // จำลองข้อมูลผู้ใช้งาน (สำหรับการทดสอบ)
    const mockUser = {
      id: 'ext-req-001',
      email: body.email,
      organizationName: 'โรงพยาบาลตัวอย่าง',
      organizationType: 'hospital',
      status: 'approved',
      dataAccessLevel: 'standard',
      allowedRequestTypes: ['medical_records', 'lab_results'],
      maxConcurrentRequests: 10
    };

    // สร้าง JWT token
    const token = jwt.sign(
      {
        userId: mockUser.id,
        email: mockUser.email,
        role: 'external_requester',
        organizationName: mockUser.organizationName,
        dataAccessLevel: mockUser.dataAccessLevel
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // บันทึก login log
    console.log('External requester login:', {
      email: body.email,
      organizationName: mockUser.organizationName,
      loginTime: new Date().toISOString()
    });

    const response: LoginResponse = {
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        organizationName: mockUser.organizationName,
        organizationType: mockUser.organizationType,
        status: mockUser.status,
        dataAccessLevel: mockUser.dataAccessLevel
      }
    };

    const nextResponse = NextResponse.json(response, { status: 200 });

    // Set cookie
    nextResponse.cookies.set('external-requester-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return nextResponse;

  } catch (error) {
    console.error('External requester login error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
    }, { status: 500 });
  }
}
