import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthLoginRequest {
  username: string;
  password: string;
}

interface AuthLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    emailVerified: boolean;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthLoginRequest = await request.json();
    
    // Validation
    if (!body.username || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุชื่อผู้ใช้หรืออีเมลและรหัสผ่าน'
      }, { status: 400 });
    }

    // จำลองการตรวจสอบข้อมูลจากฐานข้อมูล
    // ในระบบจริงจะต้องเช็คกับฐานข้อมูล users table
    // const user = await db.users.findUnique({
    //   where: { 
    //     OR: [
    //       { username: body.username },
    //       { email: body.username }
    //     ],
    //     is_active: true
    //   }
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

    // Check if user is patient and email not verified
    // if (user.role === 'patient' && !user.email_verified) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
    //     requiresEmailVerification: true,
    //     email: user.email
    //   }, { status: 401 });
    // }

    // จำลองข้อมูลผู้ใช้ (สำหรับการทดสอบ)
    const mockUser = {
      id: 'user-001',
      username: body.username,
      email: 'user@example.com',
      role: 'patient', // หรือ 'doctor', 'nurse', etc.
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      emailVerified: true
    };

    // สร้าง JWT tokens
    const token = jwt.sign(
      {
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: mockUser.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Log successful login (จำลอง)
    console.log(`User login successful: ${body.username}`);

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      refreshToken,
      user: mockUser
    }, { status: 200 });

    // Set cookies
    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 });
  }
}
