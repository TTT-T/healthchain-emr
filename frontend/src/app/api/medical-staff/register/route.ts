import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate required fields
    const requiredFields = [
      'titlePrefix', 'firstName', 'lastName', 'email', 'confirmEmail', 
      'phone', 'nationalId', 'birthDate', 'gender', 'profession',
      'medicalLicenseNumber', 'specialization', 'department',
      'username', 'password', 'confirmPassword'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          message: `กรุณากรอกข้อมูล ${field}`
        }, { status: 400 });
      }
    }
    
    // Validate email confirmation
    if (body.email !== body.confirmEmail) {
      return NextResponse.json({
        success: false,
        message: 'อีเมลไม่ตรงกัน'
      }, { status: 400 });
    }
    
    // Validate password confirmation
    if (body.password !== body.confirmPassword) {
      return NextResponse.json({
        success: false,
        message: 'รหัสผ่านไม่ตรงกัน'
      }, { status: 400 });
    }
    
    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      }, { status: 400 });
    }
    
    // Validate profession
    const validProfessions = ['doctor', 'nurse', 'staff'];
    if (!validProfessions.includes(body.profession)) {
      return NextResponse.json({
        success: false,
        message: 'อาชีพไม่ถูกต้อง'
      }, { status: 400 });
    }
    
    // Prepare data for backend
    const registrationData = {
      // User data
      titlePrefix: body.titlePrefix,
      firstName: body.firstName, // Thai first name
      lastName: body.lastName,   // Thai last name
      firstNameEn: body.firstNameEn || '',
      lastNameEn: body.lastNameEn || '',
      email: body.email,
      phone: body.phone,
      nationalId: body.nationalId,
      birthDate: body.birthDate,
      gender: body.gender,
      username: body.username,
      password: body.password,
      role: body.profession,
      
      // Professional data
      medicalLicenseNumber: body.medicalLicenseNumber,
      specialization: body.specialization,
      department: body.department,
      experience: body.experience || '0'
    };
    
    // Call backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendEndpoint = `${backendUrl}/api/auth/register`;
    let response;
    try {
      response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
    } catch (fetchError) {
      console.error('Failed to connect to backend:', fetchError);
      return NextResponse.json({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานอยู่'
      }, { status: 503 });
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse backend response:', jsonError);
      const textResponse = await response.text();
      console.error('Raw backend response:', textResponse);
      return NextResponse.json({
        success: false,
        message: 'เซิร์ฟเวอร์ส่งข้อมูลที่ไม่ถูกต้อง',
        details: textResponse
      }, { status: 500 });
    }
    if (response.ok) {
      // Check if registration was successful based on status code and data
      const isSuccess = response.status === 200 || response.status === 201;
      const hasUserData = result.data && result.data.user;
      
      if (isSuccess && hasUserData) {
        return NextResponse.json({
          success: true,
          message: result.data.message || 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี และรอการอนุมัติจาก admin',
          requiresEmailVerification: result.data.requiresEmailVerification,
          requiresAdminApproval: result.data.requiresAdminApproval,
          emailSent: result.data.emailSent
        });
      } else {
        // Registration failed
        return NextResponse.json({
          success: false,
          message: result.message || result.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
          details: result
        }, { status: response.status });
      }
    } else {
      console.error('Backend registration failed:', {
        status: response.status,
        result: result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'null/undefined'
      });
      
      return NextResponse.json({
        success: false,
        message: result.message || result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
        details: result
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('Medical staff registration error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? (error as any).message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
    }, { status: 500 });
  }
}
