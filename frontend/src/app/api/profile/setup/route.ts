import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Interface สำหรับข้อมูล Profile
interface ProfileSetupData {
  religion: string; // อาจเป็น "ยิว" ถ้าผู้ใช้เลือก "อื่นๆ"
  race: string; // อาจเป็น "ญี่ปุ่น" ถ้าผู้ใช้เลือก "อื่นๆ"
  idCardAddress: {
    houseNo: string;
    moo: string;
    soi: string;
    road: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    fullAddress: string;
  };
  currentAddress: {
    houseNo: string;
    moo: string;
    soi: string;
    road: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    fullAddress: string;
    sameAsIdCard: boolean;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation: string; // อาจเป็น "เจ้านาย" ถ้าผู้ใช้เลือก "อื่นๆ"
  };
  medicalInfo: {
    bloodGroup: string;
    bloodType: string;
    chronicDiseases: string;
    currentMedications: string;
    allergies: {
      drugs: string;
      foods: string;
      environment: string;
    };
  };
  securitySettings: {
    twoFactorAuth: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  profileCompletedAt: string;
  profileVersion: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProfileSetupData = await request.json();
    
    // ได้ user ID จาก JWT token (จำลอง)
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // const userId = decoded.userId;
    const userId = 'user_123'; // จำลอง

    // Validation
    if (!body.religion || !body.race) {
      return NextResponse.json(
        { error: 'ข้อมูลพื้นฐานไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูลสำหรับบันทึกลง database
    const profileData = {
      userId: userId,
      
      // ข้อมูลพื้นฐาน
      religion: body.religion, // อาจเป็น "ยิว" หรือ "บาไฮ" ถ้าผู้ใช้เลือก "อื่นๆ"
      race: body.race, // อาจเป็น "ญี่ปุ่น" หรือ "เกาหลี" ถ้าผู้ใช้เลือก "อื่นๆ"
      
      // ที่อยู่ (เก็บทั้งแบบแยกฟิลด์และรวมเป็น string)
      idCardAddress: body.idCardAddress,
      currentAddress: body.currentAddress,
      
      // ข้อมูลติดต่อฉุกเฉิน
      emergencyContactName: body.emergencyContact.name,
      emergencyContactPhone: body.emergencyContact.phone,
      emergencyContactRelation: body.emergencyContact.relation, // อาจเป็น "เจ้านาย" ถ้าเลือก "อื่นๆ"
      
      // ข้อมูลทางการแพทย์
      bloodGroup: body.medicalInfo.bloodGroup,
      bloodType: body.medicalInfo.bloodType,
      chronicDiseases: body.medicalInfo.chronicDiseases,
      currentMedications: body.medicalInfo.currentMedications,
      drugAllergies: body.medicalInfo.allergies.drugs,
      foodAllergies: body.medicalInfo.allergies.foods,
      environmentAllergies: body.medicalInfo.allergies.environment,
      
      // การตั้งค่าความปลอดภัย
      twoFactorAuth: body.securitySettings.twoFactorAuth,
      emailNotifications: body.securitySettings.emailNotifications,
      smsNotifications: body.securitySettings.smsNotifications,
      
      // Metadata
      profileCompletedAt: new Date(body.profileCompletedAt),
      profileVersion: body.profileVersion,
      updatedAt: new Date()
    };

    logger.('Profile data to save:', profileData);

    // บันทึกข้อมูล profile ลง database (จำลอง)
    // const profile = await db.userProfile.create({ data: profileData });

    // อัปเดตสถานะ profileCompleted ของ user
    // await db.user.update({
    //   where: { id: userId },
    //   data: { profileCompleted: true }
    // });

    // สร้าง audit log สำหรับการเปลี่ยนแปลงข้อมูล
    // await db.auditLog.create({
    //   data: {
    //     userId: userId,
    //     action: 'PROFILE_SETUP_COMPLETED',
    //     details: JSON.stringify(profileData),
    //     timestamp: new Date()
    //   }
    // });

    const responseData = {
      message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ',
      profile: {
        id: 'profile_456', // จำลอง ID
        userId: userId,
        religion: profileData.religion,
        race: profileData.race,
        profileCompleted: true,
        completedAt: profileData.profileCompletedAt
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    logger.error('Profile setup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    );
  }
}
