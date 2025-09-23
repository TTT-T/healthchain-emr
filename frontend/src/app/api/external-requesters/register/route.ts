import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Interface สำหรับข้อมูลการลงทะเบียน external requester
interface ExternalRequesterRegistrationData {
  // Organization Information
  organizationName: string;
  organizationType: 'hospital' | 'clinic' | 'insurance_company' | 'research_institute' | 'government_agency' | 'legal_entity' | 'audit_organization';
  
  // Registration Details
  registrationNumber: string;
  licenseNumber?: string;
  taxId?: string;
  
  // Contact Information
  primaryContactTitle: string;
  primaryContactFirstNameThai: string;
  primaryContactLastNameThai: string;
  primaryContactFirstNameEnglish: string;
  primaryContactLastNameEnglish: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  
  // Address (JSONB in database)
  address: {
    streetAddress: string;
    subDistrict: string;      // ตำบล/แขวง
    district: string;         // อำเภอ/เขต
    province: string;         // จังหวัด
    postalCode: string;       // รหัสไปรษณีย์
    country: string;          // ประเทศ
  };
  
  // Access Permissions
  allowedRequestTypes: string[];              // JSONB array
  dataAccessLevel: 'basic' | 'standard' | 'premium';
  maxConcurrentRequests: number;
  
  // Compliance Information
  complianceCertifications: string[];         // JSONB array
  dataProtectionCertification?: string;
  
  // Supporting Documents (file metadata)
  verificationDocuments: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadDate: string;
  }[];

  // Account Setup for Login
  loginEmail: string;
  password: string;
  confirmPassword: string;
}

// Response interface
interface RegistrationResponse {
  success: boolean;
  message: string;
  requestId?: string;
  estimatedReviewTime?: string;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: ExternalRequesterRegistrationData = await request.json();
    
    // Validation - ตรวจสอบข้อมูลที่จำเป็น
    const requiredFields = {
      organizationName: body.organizationName,
      organizationType: body.organizationType,
      registrationNumber: body.registrationNumber,
      primaryContactTitle: body.primaryContactTitle,
      primaryContactFirstNameThai: body.primaryContactFirstNameThai,
      primaryContactLastNameThai: body.primaryContactLastNameThai,
      primaryContactEmail: body.primaryContactEmail,
      primaryContactPhone: body.primaryContactPhone,
      'address.streetAddress': body.address?.streetAddress,
      'address.subDistrict': body.address?.subDistrict,
      'address.district': body.address?.district,
      'address.province': body.address?.province,
      'address.postalCode': body.address?.postalCode,
      loginEmail: body.loginEmail,
      password: body.password,
      confirmPassword: body.confirmPassword,
    };

    // ตรวจสอบว่าข้อมูลที่จำเป็นครบถ้วนหรือไม่
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน',
        missingFields: missingFields
      }, { status: 400 });
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.(body.primaryContactEmail)) {
      return NextResponse.json({
        success: false,
        error: 'รูปแบบอีเมลติดต่อไม่ถูกต้อง'
      }, { status: 400 });
    }

    // ตรวจสอบ login email
    if (!emailRegex.(body.loginEmail)) {
      return NextResponse.json({
        success: false,
        error: 'รูปแบบ login email ไม่ถูกต้อง'
      }, { status: 400 });
    }

    // ตรวจสอบ password
    if (body.password !== body.confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'รหัสผ่านไม่ตรงกัน'
      }, { status: 400 });
    }

    if (body.password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
      }, { status: 400 });
    }

    // ตรวจสอบว่าต้องเลือกประเภทคำขออย่างน้อย 1 ประเภท
    if (!body.allowedRequestTypes || body.allowedRequestTypes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาเลือกประเภทคำขออย่างน้อย 1 ประเภท'
      }, { status: 400 });
    }

    // ตรวจสอบข้อมูลซ้ำ (จำลอง - ในระบบจริงจะต้องเช็คกับ database)
    // const existingOrg = await db.external_requesters.findUnique({
    //   where: { 
    //     OR: [
    //       { registration_number: body.registrationNumber },
    //       { organization_name: body.organizationName }
    //     ]
    //   }
    // });
    // 
    // if (existingOrg) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'องค์กรนี้ได้ลงทะเบียนแล้วในระบบ'
    //   }, { status: 409 });
    // }

    // สร้าง Request ID สำหรับการติดตาม
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // บันทึกข้อมูลลงฐานข้อมูลจริง
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const registrationData = {
      request_id: requestId,
      organization_name: body.organizationName,
      organization_type: body.organizationType,
      registration_number: body.registrationNumber,
      license_number: body.licenseNumber || null,
      tax_id: body.taxId || null,
      primary_contact_title: body.primaryContactTitle,
      primary_contact_first_name_thai: body.primaryContactFirstNameThai,
      primary_contact_last_name_thai: body.primaryContactLastNameThai,
      primary_contact_first_name_english: body.primaryContactFirstNameEnglish,
      primary_contact_last_name_english: body.primaryContactLastNameEnglish,
      primary_contact_email: body.primaryContactEmail,
      primary_contact_phone: body.primaryContactPhone,
      address: body.address,
      allowed_request_types: body.allowedRequestTypes,
      data_access_level: body.dataAccessLevel,
      max_concurrent_requests: body.maxConcurrentRequests,
      compliance_certifications: body.complianceCertifications,
      data_protection_certification: body.dataProtectionCertification || null,
      verification_documents: body.verificationDocuments,
      
      // Account credentials (password should be hashed in real system)
      login_email: body.loginEmail,
      password_hash: body.password, // ในระบบจริงต้อง hash ด้วย bcrypt หรือ similar
      
      // Personal information for users table
      username: body.username,
      firstNameThai: body.firstNameThai || body.primaryContactFirstNameThai,
      lastNameThai: body.lastNameThai || body.primaryContactLastNameThai,
      firstNameEnglish: body.firstNameEnglish || body.primaryContactFirstNameEnglish,
      lastNameEnglish: body.lastNameEnglish || body.primaryContactLastNameEnglish,
      title: body.title || body.primaryContactTitle,
      nationalId: body.nationalId,
      birthDate: body.birthDate,
      gender: body.gender,
      nationality: body.nationality || 'Thai',
      currentAddress: body.currentAddress,
      idCardAddress: body.idCardAddress,
      
      status: 'pending_review',  // สถานะเริ่มต้น
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    logger.('Registration data to be saved:', registrationData);

    // ส่งข้อมูลไปยัง backend เพื่อบันทึกลงฐานข้อมูล
    try {
      const backendResponse = await fetch(`${backendUrl}/api/external-requesters/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        logger.error('Backend registration failed:', errorData);
        throw new Error(errorData.message || 'Backend registration failed');
      }

      const backendResult = await backendResponse.json();
      logger.('Backend registration successful:', backendResult);
    } catch (backendError) {
      logger.safeError('Error calling backend registration:', backendError);
      // ยังคงส่ง response สำเร็จให้ frontend แต่ log error
      // ในระบบจริงอาจจะต้องจัดการ error นี้ให้ดีกว่านี้
    }

    // จำลองการส่งอีเมลแจ้งเตือน
    // await sendNotificationEmail({
    //   to: body.primaryContactEmail,
    //   subject: 'การลงทะเบียนผู้ขอเข้าถึงข้อมูล - รออนุมัติ',
    //   template: 'external-requester-pending',
    //   data: {
    //     organizationName: body.organizationName,
    //     requestId: requestId,
    //     estimatedReviewTime: '3-5 วันทำการ'
    //   }
    // });

    // จำลองการแจ้งเตือนผู้ดูแลระบบ
    // await sendAdminNotification({
    //   type: 'new_external_requester_registration',
    //   data: {
    //     requestId: requestId,
    //     organizationName: body.organizationName,
    //     organizationType: body.organizationType,
    //     contactEmail: body.primaryContactEmail
    //   }
    // });

    const response: RegistrationResponse = {
      success: true,
      message: 'การลงทะเบียนสำเร็จ! ข้อมูลของคุณอยู่ระหว่างการตรวจสอบ',
      requestId: requestId,
      estimatedReviewTime: '3-5 วันทำการ'
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    
    // Add CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return nextResponse;

  } catch (error) {
    logger.error('Registration error:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
    }, { status: 500 });
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// GET method สำหรับตรวจสอบสถานะการลงทะเบียน
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const email = searchParams.get('email');

    if (!requestId && !email) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุ Request ID หรืออีเมล'
      }, { status: 400 });
    }

    // จำลองการค้นหาข้อมูลจากฐานข้อมูล
    // const registration = await db.external_requesters.findFirst({
    //   where: requestId 
    //     ? { request_id: requestId }
    //     : { primary_contact_email: email },
    //   select: {
    //     request_id: true,
    //     organization_name: true,
    //     status: true,
    //     created_at: true,
    //     updated_at: true,
    //     admin_notes: true
    //   }
    // });

    // จำลองข้อมูลสถานะ
    const mockStatus = {
      requestId: requestId || 'REQ-1234567890-ABCDEF123',
      organizationName: 'โรงพยาบาลตัวอย่าง',
      status: 'pending_review',
      submittedAt: '2025-01-14T10:30:00Z',
      lastUpdated: '2025-01-14T10:30:00Z',
      estimatedCompletion: '2025-01-17T17:00:00Z',
      adminNotes: null
    };

    return NextResponse.json({
      success: true,
      data: mockStatus
    });

  } catch (error) {
    logger.error('Status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
    }, { status: 500 });
  }
}
