import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AdminLoginRequest {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    organizationId?: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json();
    
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
    // ในระบบจริงจะต้องเช็คกับฐานข้อมูล users table โดย role = 'admin'
    // const user = await db.users.findUnique({
    //   where: { 
    //     email: body.email,
    //     role: 'admin',
    //     is_active: true
    //   }
    // });
    
    // if (!user) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'ไม่พบผู้ดูแลระบบ'
    //   }, { status: 401 });
    // }

    // const isPasswordValid = await bcrypt.compare(body.password, user.password_hash);
    // if (!isPasswordValid) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'รหัสผ่านไม่ถูกต้อง'
    //   }, { status: 401 });
    // }

    // จำลองข้อมูลผู้ดูแลระบบ (สำหรับการทดสอบ)
    const mockAdmin = {
      id: 'admin-001',
      email: body.email,
      role: 'admin',
      permissions: [
        'user_management',
        'system_monitoring',
        'audit_logs',
        'database_management',
        'consent_management',
        'external_requester_approval'
      ],
      organizationId: 'org-001'
    };

    // สร้าง JWT token
    const token = jwt.sign(
      {
        userId: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
        permissions: mockAdmin.permissions,
        organizationId: mockAdmin.organizationId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log successful login (จำลอง)
    console.log(`Admin login successful: ${body.email}`);

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: mockAdmin
    }, { status: 200 });

    // Set cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 });
  }
}
