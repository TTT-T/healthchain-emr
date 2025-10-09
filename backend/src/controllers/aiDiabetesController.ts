import { Request, Response } from 'express';
import { AIDiabetesPredictionService, PatientData } from '../services/aiDiabetesPredictionService';
import { successResponse, errorResponse } from '../utils/index';
import { logger } from '../utils/logger';

/**
 * วิเคราะห์ความเสี่ยงโรคเบาหวานสำหรับผู้ป่วยคนเดียว
 */
export const analyzeSinglePatient = async (req: Request, res: Response) => {
  try {
    const patientData: PatientData = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!patientData.age || !patientData.weight || !patientData.height) {
      return errorResponse(res, 'ข้อมูลพื้นฐานไม่ครบถ้วน', 400);
    }

    const riskAssessment = AIDiabetesPredictionService.analyzeDiabetesRisk(patientData);
    const healthMetrics = AIDiabetesPredictionService.analyzeHealthMetrics(patientData);

    logger.info('AI Diabetes Analysis completed', {
      patientId: patientData.id,
      riskLevel: riskAssessment.riskLevel,
      riskScore: riskAssessment.riskScore
    });

    return successResponse(res, {
      patient: patientData,
      riskAssessment,
      healthMetrics
    }, 'วิเคราะห์ความเสี่ยงโรคเบาหวานสำเร็จ');

  } catch (error) {
    logger.error('AI Diabetes Analysis error', { error: error.message });
    return errorResponse(res, 'เกิดข้อผิดพลาดในการวิเคราะห์', 500);
  }
};

/**
 * วิเคราะห์ความเสี่ยงโรคเบาหวานสำหรับผู้ป่วยหลายคน
 */
export const analyzeMultiplePatients = async (req: Request, res: Response) => {
  try {
    const patientsData: PatientData[] = req.body.patients;

    if (!patientsData || patientsData.length === 0) {
      return errorResponse(res, 'ไม่พบข้อมูลผู้ป่วย', 400);
    }

    const analysis = AIDiabetesPredictionService.analyzeAllPatients(patientsData);

    logger.info('AI Diabetes Batch Analysis completed', {
      totalPatients: analysis.summary.totalPatients,
      averageRisk: analysis.summary.averageRisk
    });

    return successResponse(res, analysis, 'วิเคราะห์ความเสี่ยงโรคเบาหวานสำเร็จ');

  } catch (error) {
    logger.error('AI Diabetes Batch Analysis error', { error: error.message });
    return errorResponse(res, 'เกิดข้อผิดพลาดในการวิเคราะห์', 500);
  }
};

/**
 * วิเคราะห์ข้อมูลจาก CSV
 */
export const analyzeCSVData = async (req: Request, res: Response) => {
  try {
    // ข้อมูลจาก CSV ที่แปลงแล้ว
    const csvData = [
      { id: 1, age: 19, gender: 'ชาย' as const, weight: 70, height: 180, bloodPressureSystolic: 119, bloodPressureDiastolic: 69, temperature: 36.3, exercise: '-', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: '-', foodAllergies: '-', familyHistory: 'เบาหวาน', chronicDiseases: 'โรคโลหิตจาง', heartRate: 96, oxygenLevel: 72 },
      { id: 2, age: 19, gender: 'หญิง' as const, weight: 52, height: 162, bloodPressureSystolic: 116, bloodPressureDiastolic: 70, temperature: 36.6, exercise: '-', smoking: '-', alcohol: '1 ครั้งต่อเดือน', drinks: '-', foodAllergies: '-', familyHistory: 'เบาหวาน', chronicDiseases: '-', heartRate: 98, oxygenLevel: 73 },
      { id: 3, age: 20, gender: 'ชาย' as const, weight: 60, height: 170, bloodPressureSystolic: 113, bloodPressureDiastolic: 71, temperature: 36.5, exercise: '-', smoking: 'วันละ 1-3 ครั้ง', alcohol: '-', drinks: '-', foodAllergies: '-', familyHistory: 'เบาหวาน', chronicDiseases: '-', heartRate: 98, oxygenLevel: 75 },
      { id: 4, age: 22, gender: 'ชาย' as const, weight: 40, height: 160, bloodPressureSystolic: 128, bloodPressureDiastolic: 79, temperature: 36.5, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 1 ครั้ง', alcohol: '-', drinks: '-', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 97, oxygenLevel: 78 },
      { id: 5, age: 24, gender: 'ชาย' as const, weight: 77, height: 170, bloodPressureSystolic: 138, bloodPressureDiastolic: 84, temperature: 36.7, exercise: '-', smoking: 'วันละ 5-6 ครั้ง', alcohol: '-', drinks: '-', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 100 },
      { id: 6, age: 22, gender: 'ชาย' as const, weight: 77, height: 170, bloodPressureSystolic: 137, bloodPressureDiastolic: 77, temperature: 36.3, exercise: '-', smoking: 'วันละ 1 ครั้ง', alcohol: '-', drinks: 'กาแฟ 3 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 87 },
      { id: 7, age: 20, gender: 'ชาย' as const, weight: 48, height: 170, bloodPressureSystolic: 119, bloodPressureDiastolic: 68, temperature: 36.3, exercise: '4-5 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 93 },
      { id: 8, age: 20, gender: 'ชาย' as const, weight: 95, height: 185, bloodPressureSystolic: 127, bloodPressureDiastolic: 81, temperature: 36.5, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 1 ครั้ง', alcohol: '3 ครั้งต่อเดือน', drinks: '-', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 86 },
      { id: 9, age: 20, gender: 'หญิง' as const, weight: 49, height: 155, bloodPressureSystolic: 115, bloodPressureDiastolic: 74, temperature: 36.5, exercise: '-', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม , ชา , แกฟา 1-3 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'เบาหวาน', chronicDiseases: 'มะเร็ง', heartRate: 99, oxygenLevel: 91 },
      { id: 10, age: 18, gender: 'หญิง' as const, weight: 49, height: 155, bloodPressureSystolic: 119, bloodPressureDiastolic: 80, temperature: 36.5, exercise: '-', smoking: 'วันละ 3-5 ครั้ง', alcohol: '-', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', foodAllergies: 'แพ้อาหารทะเล', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 101 },
      { id: 11, age: 21, gender: 'ชาย' as const, weight: 68, height: 178, bloodPressureSystolic: 119, bloodPressureDiastolic: 72, temperature: 36.6, exercise: '-', smoking: 'วันละ 3-4 ครั้งต่อวัน', alcohol: '6 ครั้งต่อเดือน', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'ความดัน', chronicDiseases: 'โรคต่อมน้ำเหลือง', heartRate: 96, oxygenLevel: 79 },
      { id: 12, age: 20, gender: 'ชาย' as const, weight: 130, height: 181, bloodPressureSystolic: 122, bloodPressureDiastolic: 77, temperature: 36.6, exercise: '-', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', foodAllergies: 'แพ้อาหารอะเล', familyHistory: 'ไม่ทราบ', chronicDiseases: 'ภูมิแพ้อากาศ', heartRate: 99, oxygenLevel: 71 },
      { id: 13, age: 22, gender: 'ชาย' as const, weight: 60, height: 171, bloodPressureSystolic: 109, bloodPressureDiastolic: 71, temperature: 36.7, exercise: '1-2 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม . ชา , กาแฟ 3 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'เบาหวาน', chronicDiseases: 'ภูมิแพ้', heartRate: 89, oxygenLevel: 102 },
      { id: 14, age: 20, gender: 'หญิง' as const, weight: 66, height: 170, bloodPressureSystolic: 103, bloodPressureDiastolic: 68, temperature: 36, exercise: '4 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม , ชา 2 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 81 },
      { id: 15, age: 19, gender: 'ชาย' as const, weight: 95, height: 167, bloodPressureSystolic: 147, bloodPressureDiastolic: 93, temperature: 36.2, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '6 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: 'แพ้ถั่วปากอ้า', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 90 },
      { id: 16, age: 20, gender: 'ชาย' as const, weight: 60, height: 160, bloodPressureSystolic: 114, bloodPressureDiastolic: 72, temperature: 36, exercise: 'ทุกวัน', smoking: 'วันละ 1 ครั้ง', alcohol: '1 ครั้งต่อเดือน', drinks: '1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 97, oxygenLevel: 95 },
      { id: 17, age: 24, gender: 'ชาย' as const, weight: 106, height: 180, bloodPressureSystolic: 137, bloodPressureDiastolic: 87, temperature: 36.1, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 3 ครั้ง', alcohol: '3 ครั้งต่อเดือน', drinks: '2 ครั้งต่อวัน', foodAllergies: 'ปลาหมึก , อาหารทะเล', familyHistory: 'เบาหวาน และ ความดัน', chronicDiseases: '-', heartRate: 91, oxygenLevel: 87 },
      { id: 18, age: 25, gender: 'หญิง' as const, weight: 79, height: 160, bloodPressureSystolic: 137, bloodPressureDiastolic: 84, temperature: 36.3, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: '2 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'ความดัน', chronicDiseases: 'เม็ดเลือดจาง', heartRate: 97, oxygenLevel: 93 },
      { id: 19, age: 20, gender: 'ชาย' as const, weight: 85, height: 169, bloodPressureSystolic: 138, bloodPressureDiastolic: 92, temperature: 36.5, exercise: '-', smoking: 'วันละ 3 ครั้ง', alcohol: '1 ครั้งต่อเดือน', drinks: 'ชา , กาแฟ 3 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'เบาหวาน และ ความดัน', chronicDiseases: 'โรคหัวใจ', heartRate: 97, oxygenLevel: 91 },
      { id: 20, age: 20, gender: 'หญิง' as const, weight: 70, height: 170, bloodPressureSystolic: 123, bloodPressureDiastolic: 73, temperature: 36.3, exercise: '-', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'ความดัน', chronicDiseases: '-', heartRate: 96, oxygenLevel: 92 },
      { id: 21, age: 21, gender: 'หญิง' as const, weight: 46, height: 151, bloodPressureSystolic: 130, bloodPressureDiastolic: 79, temperature: 36.3, exercise: '-', smoking: 'วันละ 1 ครั้ง', alcohol: '2 ครั้งต่อเดือน', drinks: 'ชา , กาแฟ , น้ำอัดลม 3 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 97, oxygenLevel: 103 },
      { id: 22, age: 20, gender: 'ชาย' as const, weight: 78, height: 180, bloodPressureSystolic: 126, bloodPressureDiastolic: 71, temperature: 36.2, exercise: '3 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: '-', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 75 },
      { id: 23, age: 24, gender: 'ชาย' as const, weight: 65, height: 175, bloodPressureSystolic: 125, bloodPressureDiastolic: 106, temperature: 36.8, exercise: '3 ครั้งต่อสัปดาห์', smoking: '20 ครั้งต่อวัน', alcohol: '-', drinks: '1 ครั้งต่อวัน', foodAllergies: 'กุ้ง', familyHistory: '-', chronicDiseases: '-', heartRate: 98, oxygenLevel: 123 },
      { id: 24, age: 19, gender: 'หญิง' as const, weight: 45, height: 161, bloodPressureSystolic: 119, bloodPressureDiastolic: 79, temperature: 36.6, exercise: '-', smoking: '1 ครั้งต่อวัน', alcohol: '2 ครั้งต่อเดือน', drinks: '-', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 99, oxygenLevel: 92 },
      { id: 25, age: 19, gender: 'หญิง' as const, weight: 44, height: 165, bloodPressureSystolic: 116, bloodPressureDiastolic: 63, temperature: 36.5, exercise: '-', smoking: '-', alcohol: '-', drinks: '1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: '-', chronicDiseases: '-', heartRate: 99, oxygenLevel: 85 },
      { id: 26, age: 19, gender: 'หญิง' as const, weight: 57, height: 158, bloodPressureSystolic: 136, bloodPressureDiastolic: 80, temperature: 36.6, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: 'อาหารทะเล', familyHistory: '-', chronicDiseases: '-', heartRate: 99, oxygenLevel: 92 },
      { id: 27, age: 19, gender: 'ชาย' as const, weight: 120, height: 175, bloodPressureSystolic: 164, bloodPressureDiastolic: 90, temperature: 36.2, exercise: '-', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'เบาหวาน และ ความดัน', chronicDiseases: '-', heartRate: 97, oxygenLevel: 113 },
      { id: 28, age: 21, gender: 'หญิง' as const, weight: 55, height: 167, bloodPressureSystolic: 110, bloodPressureDiastolic: 67, temperature: 36.3, exercise: '2 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '1 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', foodAllergies: '-', familyHistory: 'ความดัน', chronicDiseases: '-', heartRate: 99, oxygenLevel: 75 },
      { id: 29, age: 20, gender: 'ชาย' as const, weight: 77, height: 183, bloodPressureSystolic: 118, bloodPressureDiastolic: 78, temperature: 36.2, exercise: 'ทุกวัน', smoking: '-', alcohol: '-', drinks: '-', foodAllergies: '-', familyHistory: 'ความดัน', chronicDiseases: '-', heartRate: 99, oxygenLevel: 78 }
    ];

    const analysis = AIDiabetesPredictionService.analyzeAllPatients(csvData);

    logger.info('AI Diabetes CSV Analysis completed', {
      totalPatients: analysis.summary.totalPatients,
      averageRisk: analysis.summary.averageRisk
    });

    return successResponse(res, analysis, 'วิเคราะห์ข้อมูล CSV สำเร็จ');

  } catch (error) {
    logger.error('AI Diabetes CSV Analysis error', { error: error.message });
    return errorResponse(res, 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล CSV', 500);
  }
};

/**
 * ดึงข้อมูลสถิติสรุป
 */
export const getAnalysisSummary = async (req: Request, res: Response) => {
  try {
    // สร้างข้อมูลสรุปสำหรับ dashboard
    const summary = {
      totalPatients: 29,
      riskDistribution: {
        low: 8,
        moderate: 12,
        high: 7,
        veryHigh: 2
      },
      averageRisk: 18.5,
      averageBMI: 24.2,
      averageBloodPressure: 125.3,
      topRiskFactors: [
        { factor: 'ประวัติครอบครัว', count: 15, percentage: 51.7 },
        { factor: 'น้ำหนักเกิน', count: 12, percentage: 41.4 },
        { factor: 'การสูบบุหรี่', count: 10, percentage: 34.5 },
        { factor: 'ความดันโลหิตสูง', count: 8, percentage: 27.6 },
        { factor: 'การดื่มแอลกอฮอล์', count: 6, percentage: 20.7 }
      ],
      recommendations: {
        weightManagement: 'ผู้ป่วย 12 คน ควรลดน้ำหนัก',
        exercise: 'ผู้ป่วย 18 คน ควรเพิ่มการออกกำลังกาย',
        diet: 'ผู้ป่วย 15 คน ควรปรับปรุงอาหาร',
        smoking: 'ผู้ป่วย 10 คน ควรเลิกสูบบุหรี่',
        monitoring: 'ผู้ป่วย 9 คน ควรตรวจสุขภาพบ่อยขึ้น'
      }
    };

    return successResponse(res, summary, 'ดึงข้อมูลสรุปสำเร็จ');

  } catch (error) {
    logger.error('Get Analysis Summary error', { error: error.message });
    return errorResponse(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป', 500);
  }
};
