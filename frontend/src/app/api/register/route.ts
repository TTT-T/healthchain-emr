import { NextRequest, NextResponse } from 'next/server';

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

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (จำลอง)
    // ในระบบจริงจะต้องเช็คกับ database
    // const existingUser = await db.user.findUnique({ where: { email: body.email } });
    // if (existingUser) {
    //   return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้แล้ว' }, { status: 409 });
    // }

    // เตรียมข้อมูลสำหรับบันทึกลง database
    const userData = {
      email: body.email,
      // password: await bcrypt.hash(body.password, 10), // hash password
      password: body.password, // ในตัวอย่างนี้ไม่ได้ hash
      idCard: body.idCard,
      titlePrefix: body.titlePrefix, // อาจเป็น "พลตำรวจ" ถ้าผู้ใช้เลือก "อื่นๆ"
      firstName: body.firstName,
      lastName: body.lastName,
      birthDate: new Date(body.birthDate),
      gender: body.gender,
      phone: body.phone,
      userType: body.userType,
      createdAt: new Date(),
      profileCompleted: false // จะเป็น true หลังจากทำ setup-profile เสร็จ
    };

    console.log('User data to save:', userData);

    // บันทึกลง database (จำลอง)
    // const newUser = await db.user.create({ data: userData });

    // สร้าง JWT token (จำลอง)
    // const token = jwt.sign(
    //   { userId: newUser.id, email: newUser.email },
    //   process.env.JWT_SECRET!,
    //   { expiresIn: '24h' }
    // );

    // ส่งกลับข้อมูลผู้ใช้ (ไม่รวม password)
    const responseData = {
      message: 'สร้างบัญชีสำเร็จ',
      user: {
        id: 'user_123', // จำลอง ID
        email: userData.email,
        titlePrefix: userData.titlePrefix,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        profileCompleted: userData.profileCompleted
      },
      // token: token // ใน production จริง
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
