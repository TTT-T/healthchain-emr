"use client";
import { useState, useEffect } from "react";
import { Activity, Heart, Thermometer, Weight, Ruler, Search, Save, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { VitalSignsService } from '@/services/vitalSignsService';
import { VisitService } from '@/services/visitService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { EnhancedDataService } from '@/services/enhancedDataService';
import { AIDashboardService, PatientDiabetesRiskDetail } from '@/services/aiDashboardService';
import { CreateVitalSignsRequest } from '@/types/api';
import { logger } from '@/lib/logger';
import { createLocalDateTimeString, formatLocalDateTime } from '@/utils/timeUtils';
import { 
  getThailandTime, 
  toThailandTime, 
  formatThailandDateTime, 
  formatBuddhistDateTime,
  parseThailandTime,
  getCurrentThailandTimeString 
} from '@/utils/thailandTime';

interface Patient {
  id: string;
  hn: string;
  nationalId: string;
  thaiName: string;
  thaiLastName?: string;
  firstName?: string;
  lastName?: string;
  gender: string;
  birthDate: string;
  queueNumber: string;
  treatmentType: string;
  assignedDoctor: string;
  visitDate?: string;
  visitTime?: string;
  // Additional fields for age calculation
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  // Additional medical information
  bloodType?: string;
  drugAllergies?: string;
  foodAllergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  weight?: number;
  height?: number;
}

interface VitalSigns {
  weight: string;
  height: string;
  bmi: string;
  bmiCategory: string;
  waistCircumference: string;    // Critical for diabetes risk
  hipCircumference: string;      // For waist-hip ratio
  waistHipRatio: string;         // Calculated automatically
  systolicBP: string;
  diastolicBP: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  bloodSugar: string;
  fastingGlucose: string;        // Critical for diabetes screening
  painLevel: string;
  generalCondition: string;
  notes: string;
  measurementTime: string;
  measuredBy: string;
  
  // Additional fields for AI analysis
  bodyFatPercentage: string;     // เปอร์เซ็นต์ไขมันในร่างกาย
  muscleMass: string;           // มวลกล้ามเนื้อ (kg)
  boneDensity: string;          // ความหนาแน่นของกระดูก
  skinFoldThickness: string;    // ความหนาของผิวหนัง (mm)
  hydrationStatus: string;      // สถานะการดื่มน้ำ (ดี/ปานกลาง/ไม่ดี)
  sleepQuality: string;         // คุณภาพการนอน (1-10)
  stressLevel: string;          // ระดับความเครียด (1-10)
  depressionScore: string;      // คะแนนภาวะซึมเศร้า (0-27)
  anxietyLevel: string;         // ระดับความวิตกกังวล (1-10)
  qualityOfLifeScore: string;   // คะแนนคุณภาพชีวิต (0-100)
}

export default function VitalSigns() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // AI Risk Assessment states
  const [aiRiskData, setAiRiskData] = useState<PatientDiabetesRiskDetail | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Load AI Risk Assessment for selected patient
  const loadPatientRisk = async (patientId: string) => {
    try {
      setLoadingRisk(true);
      setRiskError(null);
      logger.info('Loading AI risk assessment for patient:', patientId);
      
      const riskData = await AIDashboardService.getPatientDiabetesRisk(patientId);
      setAiRiskData(riskData);
      logger.info('AI risk assessment loaded successfully:', riskData);
    } catch (error: any) {
      logger.error('Error loading patient risk assessment:', error);
      setRiskError('ไม่สามารถโหลดข้อมูลความเสี่ยงได้');
      setAiRiskData(null);
    } finally {
      setLoadingRisk(false);
    }
  };

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'very_high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get risk level in Thai
  const getRiskLevelThai = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'ต่ำ';
      case 'moderate': return 'ปานกลาง';
      case 'high': return 'สูง';
      case 'very_high': return 'สูงมาก';
      default: return 'ไม่ระบุ';
    }
  };
  
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    weight: "",
    height: "",
    bmi: "",
    bmiCategory: "",
    waistCircumference: "",
    hipCircumference: "",
    waistHipRatio: "",
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    bloodSugar: "",
    fastingGlucose: "",
    painLevel: "",
    generalCondition: "",
    notes: "",
    measurementTime: getCurrentThailandTimeString(),
    measuredBy: "พยาบาลสมหญิง",
    
    // Additional fields for AI analysis
    bodyFatPercentage: "",
    muscleMass: "",
    boneDensity: "",
    skinFoldThickness: "",
    hydrationStatus: "",
    sleepQuality: "",
    stressLevel: "",
    depressionScore: "",
    anxietyLevel: "",
    qualityOfLifeScore: ""
  });

  const [errors, setErrors] = useState<Partial<VitalSigns>>({});
  const [currentTime, setCurrentTime] = useState<string>(getCurrentThailandTimeString());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentThailandTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate BMI when weight or height changes
  useEffect(() => {
    if (vitalSigns.weight && vitalSigns.height) {
      const weight = parseFloat(vitalSigns.weight);
      const height = parseFloat(vitalSigns.height) / 100; // Convert cm to m
      
      if (weight > 0 && height > 0) {
        const bmi = weight / (height * height);
        const bmiValue = bmi.toFixed(1);
        let category = "";
        
        if (bmi < 18.5) {
          category = "น้ำหนักน้อย";
        } else if (bmi < 23) {
          category = "ปกติ";
        } else if (bmi < 25) {
          category = "เกิน";
        } else if (bmi < 30) {
          category = "อ้วนระดับ 1";
        } else {
          category = "อ้วนระดับ 2";
        }
        
        setVitalSigns(prev => ({
          ...prev,
          bmi: bmiValue,
          bmiCategory: category
        }));
      }
    } else {
      setVitalSigns(prev => ({
        ...prev,
        bmi: "",
        bmiCategory: ""
      }));
    }
  }, [vitalSigns.weight, vitalSigns.height]);

  // Load AI risk assessment when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientRisk(selectedPatient.id);
    } else {
      setAiRiskData(null);
      setRiskError(null);
    }
  }, [selectedPatient]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      logger.info(`🔍 Searching for patient by ${searchType}:`, searchQuery);
      
      // ค้นหาผู้ป่วยจาก API
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      logger.info('🔍 Search response:', response);
      logger.info('🔍 Response data:', response.data);
      logger.info('🔍 Data length:', Array.isArray(response.data) ? response.data.length : 0);
      logger.info('🔍 Search type:', searchType);
      logger.info('🔍 Search query:', searchQuery);
      
      if (response.data && response.data.length > 0) {
        const patient = response.data[0];
        
        // : Log the raw patient data
        logger.info('🔍 Raw patient data from API:', patient);
        logger.info('🔍 Patient ID from API:', patient.id);
        
        // Map ข้อมูลผู้ป่วยจาก API response - ใช้ direct fields (flat structure)
        const mappedPatient: Patient = {
          id: patient.id || '',
          hn: patient.hn || patient.hospitalNumber || '',
          nationalId: patient.national_id || '',
          thaiName: patient.thaiName || patient.thaiFirstName || 'ไม่ระบุชื่อ',
          thaiLastName: patient.thaiLastName || patient.thai_last_name || '',
          firstName: patient.firstName || patient.englishFirstName || '',
          lastName: patient.lastName || patient.englishLastName || '',
          gender: patient.gender || 'ไม่ระบุ',
          birthDate: patient.birth_date || patient.birthDate || '',
          // Add birth fields for age calculation
          birth_year: patient.birthYear || patient.birth_year,
          birth_month: patient.birthMonth || patient.birth_month,
          birth_day: patient.birthDay || patient.birth_day,
          queueNumber: patient.visit_info?.visitNumber || patient.visitNumber || 'V2025000001',
          treatmentType: patient.visit_info?.visit_type === 'walk_in' ? 'ฉุกเฉิน' : 
                        patient.visit_info?.visit_type === 'appointment' ? 'นัดหมาย' : 
                        patient.visit_info?.visit_type === 'emergency' ? 'ฉุกเฉิน' : 
                        patient.visit_type === 'walk_in' ? 'ฉุกเฉิน' : 
                        patient.visit_type === 'appointment' ? 'นัดหมาย' : 
                        patient.visit_type === 'emergency' ? 'ฉุกเฉิน' : 'ฉุกเฉิน',
          assignedDoctor: patient.visit_info?.doctorName || patient.doctorName || 'นพ.สมชาย ใจดี',
          visitDate: patient.visit_info?.visit_date || patient.visit_date || patient.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          visitTime: patient.visit_info?.visit_time || patient.visit_time || patient.created_at?.split('T')[1]?.split('.')[0] || new Date().toTimeString().split(' ')[0],
          // Additional medical information
          bloodType: patient.bloodType || patient.blood_type || patient.bloodGroup || '',
          drugAllergies: patient.drugAllergies || patient.drug_allergies || '',
          foodAllergies: patient.foodAllergies || patient.food_allergies || '',
          chronicDiseases: patient.chronicDiseases || patient.chronic_diseases || '',
          currentMedications: patient.currentMedications || patient.current_medications || '',
          weight: patient.weight || 0,
          height: patient.height || 0
        };

        //  logging for patient data
        //  the actual time values being used
        const actualVisitDate = patient.visit_info?.visit_date || patient.visit_date || patient.created_at?.split('T')[0];
        const actualVisitTime = patient.visit_info?.visit_time || patient.visit_time || patient.created_at?.split('T')[1]?.split('.')[0];
        logger.info('🔍 Patient data mapping:', {
          originalPatient: patient,
          mappedPatient: mappedPatient,
          birthDate: patient.birth_date,
          calculatedAge: calculateAge(mappedPatient.birthDate, patient),
          visitInfo: patient.visit_info,
          personalInfo: patient.personal_info,
          directFields: {
            hn: patient.hn,
            thai_name: patient.thaiName,
            birth_date: patient.birth_date,
            visit_type: patient.visit_type,
            doctor_name: patient.doctorName
          },
          birthFields: {
            birth_year: patient.birthYear,
            birth_month: patient.birthMonth,
            birth_day: patient.birthDay
          }
        });

        setSelectedPatient(mappedPatient);
        setSuccess('พบข้อมูลผู้ป่วยแล้ว');
        logger.info('✅ Patient found:', mappedPatient);
        logger.info('🔍 Raw patient data:', patient);
        logger.info('🔍 Mapped patient details:', {
          hn: mappedPatient.hn,
          thaiName: mappedPatient.thaiName,
          birthDate: mappedPatient.birthDate,
          age: calculateAge(mappedPatient.birthDate, patient),
          queueNumber: mappedPatient.queueNumber,
          treatmentType: mappedPatient.treatmentType,
          assignedDoctor: mappedPatient.assignedDoctor
        });
      } else {
        // ถ้าไม่พบข้อมูลในคิว ลองค้นหาผู้ป่วยในระบบโดยตรง
        logger.info('🔍 No patient in queue, searching in system...');
        
        try {
          const systemResponse = await PatientService.searchPatients(searchQuery, 'hn');
          
          if (systemResponse.data && systemResponse.data.length > 0) {
            const patient = systemResponse.data[0];
            
            // : Log the fallback patient data
            logger.info('🔍 Fallback patient data from API:', patient);
            logger.info('🔍 Fallback Patient ID from API:', patient.id);
            
            // Map ข้อมูลผู้ป่วยจากระบบ (ใช้ข้อมูลจริงจาก API)
            const mappedPatient: Patient = {
              id: patient.id || '',
              hn: patient.hn || patient.hospitalNumber || '',
              nationalId: patient.national_id || '',
              thaiName: patient.thaiName || patient.thaiFirstName || 'ไม่ระบุชื่อ',
              thaiLastName: patient.thaiLastName || patient.thai_last_name || '',
              firstName: patient.firstName || patient.englishFirstName || '',
              lastName: patient.lastName || patient.englishLastName || '',
              gender: patient.gender || 'ไม่ระบุ',
              birthDate: patient.birth_date || patient.birthDate || '',
              // Add birth fields for age calculation
              birth_year: patient.birthYear || patient.birth_year,
              birth_month: patient.birthMonth || patient.birth_month,
              birth_day: patient.birthDay || patient.birth_day,
              queueNumber: patient.visit_info?.visitNumber || patient.visitNumber || 'V2025000001',
              treatmentType: patient.visit_info?.visit_type === 'walk_in' ? 'ฉุกเฉิน' : 
                            patient.visit_info?.visit_type === 'appointment' ? 'นัดหมาย' : 
                            patient.visit_info?.visit_type === 'emergency' ? 'ฉุกเฉิน' : 
                            patient.visit_type === 'walk_in' ? 'ฉุกเฉิน' : 
                            patient.visit_type === 'appointment' ? 'นัดหมาย' : 
                            patient.visit_type === 'emergency' ? 'ฉุกเฉิน' : 'ฉุกเฉิน',
              assignedDoctor: patient.visit_info?.doctorName || patient.doctorName || 'นพ.สมชาย ใจดี',
              visitDate: patient.visit_info?.visit_date || patient.visit_date || patient.created_at?.split('T')[0] || getThailandTime().toISOString().split('T')[0],
              visitTime: patient.visit_info?.visit_time || patient.visit_time || patient.created_at?.split('T')[1]?.split('.')[0] || getThailandTime().toTimeString().split(' ')[0],
              // Additional medical information
              bloodType: patient.bloodType || patient.blood_type || patient.bloodGroup || '',
              drugAllergies: patient.drugAllergies || patient.drug_allergies || '',
              foodAllergies: patient.foodAllergies || patient.food_allergies || '',
              chronicDiseases: patient.chronicDiseases || patient.chronic_diseases || '',
              currentMedications: patient.currentMedications || patient.current_medications || '',
              weight: patient.weight || 0,
              height: patient.height || 0
            };

            //  logging for fallback search
            logger.info('🔍 Fallback search patient data mapping:', {
              originalPatient: patient,
              mappedPatient: mappedPatient,
              birthDate: patient.birth_date,
              calculatedAge: calculateAge(mappedPatient.birthDate, patient),
              visitInfo: patient.visit_info,
              personalInfo: patient.personal_info,
              birthFields: {
                birth_year: patient.birthYear,
                birth_month: patient.birthMonth,
                birth_day: patient.birthDay
              }
            });
            setSelectedPatient(mappedPatient);
            setSuccess('พบข้อมูลผู้ป่วยในระบบ (ไม่มีข้อมูลคิว)');
            logger.info('✅ Patient found in system:', mappedPatient);
            logger.info('🔍 Fallback mapped patient details:', {
              hn: mappedPatient.hn,
              thaiName: mappedPatient.thaiName,
              birthDate: mappedPatient.birthDate,
              age: calculateAge(mappedPatient.birthDate),
              queueNumber: mappedPatient.queueNumber,
              treatmentType: mappedPatient.treatmentType,
              assignedDoctor: mappedPatient.assignedDoctor
            });
          } else {
            setSelectedPatient(null);
            setError("ไม่พบข้อมูลผู้ป่วยในระบบ กรุณาตรวจสอบข้อมูล");
          }
        } catch (systemError) {
          logger.error('❌ Error searching in system:', systemError);
          setSelectedPatient(null);
          setError("ไม่พบข้อมูลผู้ป่วยในระบบ กรุณาตรวจสอบข้อมูล");
        }
      }
      
    } catch (error: any) {
      logger.error('❌ Error searching patient:', error);
      setError((error as any).message || "เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: keyof VitalSigns, value: string) => {
    setVitalSigns(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VitalSigns> = {};

    if (!selectedPatient) {
      alert("กรุณาเลือกผู้ป่วย");
      return false;
    }

    // Required vital signs
    if (!vitalSigns.weight) newErrors.weight = "กรุณากรอกน้ำหนัก";
    if (!vitalSigns.height) newErrors.height = "กรุณากรอกส่วนสูง";
    if (!vitalSigns.systolicBP) newErrors.systolicBP = "กรุณากรอกความดัน Systolic";
    if (!vitalSigns.diastolicBP) newErrors.diastolicBP = "กรุณากรอกความดัน Diastolic";
    if (!vitalSigns.heartRate) newErrors.heartRate = "กรุณากรอกชีพจร";
    if (!vitalSigns.temperature) newErrors.temperature = "กรุณากรอกอุณหภูมิ";
    if (!vitalSigns.respiratoryRate) newErrors.respiratoryRate = "กรุณากรอกอัตราการหายใจ";
    if (!vitalSigns.generalCondition) newErrors.generalCondition = "กรุณาเลือกสถานะเบื้องต้น";

    // Validate ranges
    if (vitalSigns.weight && (parseFloat(vitalSigns.weight) < 1 || parseFloat(vitalSigns.weight) > 500)) {
      newErrors.weight = "น้ำหนักต้องอยู่ระหว่าง 1-500 กิโลกรัม";
    }
    if (vitalSigns.height && (parseFloat(vitalSigns.height) < 50 || parseFloat(vitalSigns.height) > 250)) {
      newErrors.height = "ส่วนสูงต้องอยู่ระหว่าง 50-250 เซนติเมตร";
    }
    if (vitalSigns.systolicBP && (parseFloat(vitalSigns.systolicBP) < 50 || parseFloat(vitalSigns.systolicBP) > 300)) {
      newErrors.systolicBP = "ความดัน Systolic ต้องอยู่ระหว่าง 50-300 mmHg";
    }
    if (vitalSigns.diastolicBP && (parseFloat(vitalSigns.diastolicBP) < 30 || parseFloat(vitalSigns.diastolicBP) > 200)) {
      newErrors.diastolicBP = "ความดัน Diastolic ต้องอยู่ระหว่าง 30-200 mmHg";
    }
    if (vitalSigns.heartRate && (parseFloat(vitalSigns.heartRate) < 30 || parseFloat(vitalSigns.heartRate) > 200)) {
      newErrors.heartRate = "ชีพจรต้องอยู่ระหว่าง 30-200 ครั้ง/นาที";
    }
    if (vitalSigns.temperature && (parseFloat(vitalSigns.temperature) < 30 || parseFloat(vitalSigns.temperature) > 45)) {
      newErrors.temperature = "อุณหภูมิต้องอยู่ระหว่าง 30-45 องศาเซลเซียส";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedPatient) return;
    
    setIsSubmitting(true);
    try {
      let visit;
      
      // ลองหา visit ที่มีอยู่ก่อน
      try {
        logger.info('🔍 Searching for existing visit for patient:', {
          id: selectedPatient.id,
          hn: selectedPatient.hn,
          thaiName: selectedPatient.thaiName
        });
        
        // ค้นหา visit ที่มีอยู่สำหรับผู้ป่วยนี้
        const visitsResponse = await VisitService.getVisitsByPatient(selectedPatient.id);
        
        if (visitsResponse.statusCode === 200 && visitsResponse.data && visitsResponse.data.length > 0) {
          // หา visit ล่าสุดที่ยังไม่เสร็จ
          const activeVisit = visitsResponse.data.find(v => 
            v.status === 'in_progress' || v.status === 'checked_in'
          );
          
          if (activeVisit) {
            visit = activeVisit;
            logger.info('🔍 Found existing active visit:', visit);
          } else {
            // ใช้ visit ล่าสุด
            visit = visitsResponse.data[0];
            logger.info('🔍 Using la visit:', visit);
          }
        } else {
          // ไม่พบ visit ที่มีอยู่ สร้างใหม่
          logger.info('🔍 No existing visit found, creating new one...');
          
          const visitData = {
            patientId: selectedPatient.id,
            visitType: 'walk_in' as const,
            chiefComplaint: 'ตรวจสัญญาณชีพ',
            priority: 'normal' as const,
            attendingDoctorId: user?.id
          };
          
          // Validate patient ID
          if (!selectedPatient.id || selectedPatient.id === '') {
            throw new Error('ไม่พบ Patient ID ที่ถูกต้อง กรุณาค้นหาผู้ป่วยใหม่');
          }
          
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(selectedPatient.id)) {
            throw new Error(`Patient ID ไม่ถูกต้อง: ${selectedPatient.id}`);
          }
          
          // สร้าง visit ใหม่
          const visitResponse = await VisitService.createVisit(visitData);
          
          logger.info('🔍 Visit creation response:', visitResponse);
          
          if (visitResponse.statusCode !== 200 && visitResponse.statusCode !== 201 || !visitResponse.data) {
            throw new Error(`ไม่สามารถสร้าง visit ได้: ${visitResponse.error?.message || 'Unknown error'}`);
          }
          
          visit = visitResponse.data;
        }
        logger.info('🔍 Visit data after creation:', visit);
      } catch (createError: any) {
        logger.error('❌ Error creating visit:', createError);
        
        // ถ้าสร้าง visit ไม่ได้ (อาจเป็น duplicate) ให้ค้นหา visit ที่มีอยู่แล้ว
        if (createError.message?.includes('409') || createError.message?.includes('Duplicate') || createError.response?.status === 409) {
          logger.info('Visit already exists, searching for existing visit for patient:', selectedPatient.hn);
          
          try {
            // ค้นหา visit ที่มีอยู่แล้วสำหรับผู้ป่วยนี้
            const existingVisitsResponse = await VisitService.searchVisits({
              patientId: selectedPatient.id,
              status: 'in_progress,pending,checked_in'
            });
            
            if (existingVisitsResponse.statusCode === 200 && existingVisitsResponse.data) {
              const existingVisits = existingVisitsResponse.data;
              
              // หา visit ล่าสุดสำหรับผู้ป่วยนี้
              const patientVisit = existingVisits.find((v: any) => 
                v.patient_id === selectedPatient.id && 
                (v.status === 'in_progress' || v.status === 'pending' || v.status === 'checked_in')
              );
              
              if (patientVisit) {
                visit = {
                  id: patientVisit.id,
                  visitNumber: patientVisit.visitNumber,
                  status: patientVisit.status
                };
                logger.info('Found existing visit:', visit);
              } else {
                throw new Error('ไม่พบ visit ที่มีอยู่แล้วสำหรับผู้ป่วยนี้');
              }
            } else {
              throw new Error('ไม่สามารถค้นหา visit ที่มีอยู่แล้วได้');
            }
          } catch (searchError) {
            logger.error('Error searching for existing visit:', searchError);
            throw new Error('ไม่สามารถสร้างหรือค้นหา visit ได้');
          }
        } else {
          throw createError;
        }
      }
      
      // เตรียมข้อมูล vital signs สำหรับ API
      const vitalSignsData: CreateVitalSignsRequest = {
        visitId: visit.id,
        patientId: selectedPatient.id,
        weight: vitalSigns.weight ? parseFloat(vitalSigns.weight) : undefined,
        height: vitalSigns.height ? parseFloat(vitalSigns.height) : undefined,
        waistCircumference: vitalSigns.waistCircumference ? parseFloat(vitalSigns.waistCircumference) : undefined,
        hipCircumference: vitalSigns.hipCircumference ? parseFloat(vitalSigns.hipCircumference) : undefined,
        systolicBp: vitalSigns.systolicBP ? parseFloat(vitalSigns.systolicBP) : undefined,
        diastolicBp: vitalSigns.diastolicBP ? parseFloat(vitalSigns.diastolicBP) : undefined,
        heartRate: vitalSigns.heartRate ? parseFloat(vitalSigns.heartRate) : undefined,
        bodyTemperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : undefined,
        respiratoryRate: vitalSigns.respiratoryRate ? parseFloat(vitalSigns.respiratoryRate) : undefined,
        oxygenSaturation: vitalSigns.oxygenSaturation ? parseFloat(vitalSigns.oxygenSaturation) : undefined,
        bloodSugar: vitalSigns.bloodSugar ? parseFloat(vitalSigns.bloodSugar) : undefined,
        fastingGlucose: vitalSigns.fastingGlucose ? parseFloat(vitalSigns.fastingGlucose) : undefined,
        painLevel: vitalSigns.painLevel ? parseFloat(vitalSigns.painLevel) : undefined,
        generalCondition: vitalSigns.generalCondition || undefined,
        notes: vitalSigns.notes || undefined,
        measurementTime: currentTime || undefined,
        measuredBy: vitalSigns.measuredBy || undefined,
        // Enhanced AI Analysis fields
        bodyFatPercentage: vitalSigns.bodyFatPercentage ? parseFloat(vitalSigns.bodyFatPercentage) : undefined,
        muscleMass: vitalSigns.muscleMass ? parseFloat(vitalSigns.muscleMass) : undefined,
        boneDensity: vitalSigns.boneDensity || undefined,
        skinFoldThickness: vitalSigns.skinFoldThickness ? parseFloat(vitalSigns.skinFoldThickness) : undefined,
        hydrationStatus: vitalSigns.hydrationStatus || undefined,
        sleepQuality: vitalSigns.sleepQuality ? parseInt(vitalSigns.sleepQuality) : undefined,
        stressLevel: vitalSigns.stressLevel ? parseInt(vitalSigns.stressLevel) : undefined,
        depressionScore: vitalSigns.depressionScore ? parseInt(vitalSigns.depressionScore) : undefined,
        anxietyLevel: vitalSigns.anxietyLevel ? parseInt(vitalSigns.anxietyLevel) : undefined,
        qualityOfLifeScore: vitalSigns.qualityOfLifeScore ? parseInt(vitalSigns.qualityOfLifeScore) : undefined
      };
      
      // บันทึก vital signs ใช้ endpoint ที่ถูกต้อง
      logger.info('🔍 Creating vital signs with data:', vitalSignsData);
      const vitalResponse = await VitalSignsService.createVitalSigns(vitalSignsData);
      
      logger.info('🔍 Vital signs response:', {
        statusCode: vitalResponse.statusCode,
        hasData: !!vitalResponse.data,
        error: vitalResponse.error
      });
      
      if ((vitalResponse.statusCode === 200 || vitalResponse.statusCode === 201) && vitalResponse.data) {
        // แสดงการแจ้งเตือนที่สวยงาม
        const visitNumber = visit.visitNumber || visit.id || 'N/A';
        const bmiValue = vitalResponse.data.bmi || 'N/A';
        const bmiCategory = (vitalResponse.data as any).bmiCategory || '';
        
        setSuccess(`✅ บันทึกสัญญาณชีพสำเร็จ!
        
📋 Visit Number: ${visit.visitNumber || visitNumber}
📊 BMI: ${bmiValue} ${bmiCategory ? `(${bmiCategory})` : ''}
👤 ผู้ป่วย: ${selectedPatient.thaiName} (${selectedPatient.hn})
⏰ เวลา: ${formatBuddhistDateTime(getThailandTime())}
${visit.visitNumber ? '🔄 ใช้ Visit ที่มีอยู่แล้ว' : '🆕 สร้าง Visit ใหม่'}`);

        // Auto-hide success message after 8 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 8000);
        
        // ส่งการแจ้งเตือนให้ผู้ป่วย
        await sendPatientNotification(selectedPatient, vitalResponse.data);
        
        // Reset form
        setSelectedPatient(null);
        setSearchQuery("");
        setVitalSigns({
          weight: "",
          height: "",
          bmi: "",
          bmiCategory: "",
          waistCircumference: "",
          hipCircumference: "",
          waistHipRatio: "",
          systolicBP: "",
          diastolicBP: "",
          heartRate: "",
          temperature: "",
          respiratoryRate: "",
          oxygenSaturation: "",
          bloodSugar: "",
          fastingGlucose: "",
          painLevel: "",
          generalCondition: "",
          notes: "",
          measurementTime: getCurrentThailandTimeString(),
          measuredBy: "พยาบาลสมหญิง",
          // Enhanced AI Analysis Fields
          bodyFatPercentage: "",
          muscleMass: "",
          boneDensity: "",
          skinFoldThickness: "",
          hydrationStatus: "",
          sleepQuality: "",
          stressLevel: "",
          depressionScore: "",
          anxietyLevel: "",
          qualityOfLifeScore: ""
        });
        
        logger.info('Vital signs saved:', vitalResponse.data);
        
      } else {
        logger.error('❌ Vital signs creation failed:', {
          statusCode: vitalResponse.statusCode,
          error: vitalResponse.error,
          response: vitalResponse
        });
        throw new Error(vitalResponse.error?.message || `ไม่สามารถบันทึกสัญญาณชีพได้ (Status: ${vitalResponse.statusCode})`);
      }
      
    } catch (error: any) {
      logger.error("❌ Error saving vital signs:", error);
      
      // Provide more specific error messages
      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
      
      if ((error as any).message) {
        errorMessage = (error as any).message;
      } else if ((error as any).response?.data?.message) {
        errorMessage = (error as any).message;
      } else if ((error as any).response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก";
            break;
          case 401:
            errorMessage = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
            break;
          case 403:
            errorMessage = "คุณไม่มีสิทธิ์ในการดำเนินการนี้";
            break;
          case 404:
            errorMessage = "ไม่พบข้อมูลที่ต้องการ";
            break;
          case 500:
            errorMessage = "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
            break;
          default:
            errorMessage = `เกิดข้อผิดพลาด (${error.response.status}) กรุณาลองใหม่อีกครั้ง`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string, patient?: any): number => {
    // Try to use separate birth fields if birthDate is null or empty
    if ((!birthDate || birthDate === '') && patient) {
      if (patient.birth_year && patient.birth_month && patient.birth_day) {
        let birthYear = patient.birth_year;
        let birthMonth = patient.birth_month; // Keep original month value
        let birthDay = patient.birth_day;
        
        // Convert Buddhist Era to Christian Era if year >= 2500
        if (birthYear >= 2500) {
          birthYear = birthYear - 543;
        }
        
        const today = new Date();
        let age = today.getFullYear() - birthYear;
        
        // Check if birthday has passed this year
        const currentMonth = today.getMonth() + 1; // Convert to 1-based month
        const currentDay = today.getDate();
        
        // If birthday hasn't passed this year, subtract 1 from age
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
          age--;
        }
        
        return Math.max(0, age); // Ensure age is not negative
      }
    }
    
    if (!birthDate || birthDate === '') return 0;
    
    try {
      // Handle Buddhist Era dates (if birthDate contains Thai year)
      let birthYear: number;
      let birthMonth: number;
      let birthDay: number;
      
      if (birthDate.includes('/')) {
        // Format: DD/MM/YYYY or DD/MM/YYYY (B.E.)
        const parts = birthDate.split('/');
        if (parts.length >= 3) {
          birthDay = parseInt(parts[0]);
          birthMonth = parseInt(parts[1]) - 1; // JavaScript months are 0-based
          birthYear = parseInt(parts[2]);
          
          // Convert Buddhist Era to Christian Era if year > 2500
          if (birthYear > 2500) {
            birthYear = birthYear - 543;
          }
        } else {
          return 0;
        }
      } else {
        // Try to parse as ISO date
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0;
        
        birthYear = birth.getFullYear();
        birthMonth = birth.getMonth();
        birthDay = birth.getDate();
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthYear;
      const monthDiff = today.getMonth() - birthMonth;
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
        age--;
      }
      
      return Math.max(0, age); // Ensure age is not negative
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วยเมื่อบันทึกสัญญาณชีพ
   */
  const sendPatientNotification = async (patient: Patient, vitalSignsData: any) => {
    try {
      // สร้างข้อมูลการแจ้งเตือน
      const notificationData = {
        patientHn: patient.hn || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || '',
        patientPhone: '', // ต้องดึงจากข้อมูลผู้ป่วย
        patientEmail: '', // ต้องดึงจากข้อมูลผู้ป่วย
        recordType: 'vital_signs',
        recordId: vitalSignsData.id || '',
        recordedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่',
        recordedTime: createLocalDateTimeString(new Date()),
        message: `มีการบันทึกสัญญาณชีพใหม่สำหรับคุณ ${patient.thaiName} โดย ${user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'}`
      };

      // สร้างเอกสารให้ผู้ป่วย
      await createPatientDocument(patient, vitalSignsData);
      
      logger.info('Patient document created successfully for vital signs', { 
        patientHn: notificationData.patientHn,
        recordType: 'vital_signs'
      });
    } catch (error) {
      logger.error('Error sending patient notification for vital signs:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกสัญญาณชีพ
    }
  };

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: Patient, vitalSignsData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'vital_signs',
        vitalSignsData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for vital signs', { 
        patientHn: patient.hn,
        recordType: 'vital_signs'
      });
    } catch (error) {
      logger.error('Error creating patient document for vital signs:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกสัญญาณชีพ
    }
  };

  const getBMIColor = (category: string): string => {
    switch (category) {
      case "น้ำหนักน้อย": return "text-blue-600";
      case "ปกติ": return "text-green-600";
      case "เกิน": return "text-yellow-600";
      case "อ้วนระดับ 1": return "text-orange-600";
      case "อ้วนระดับ 2": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  const getVitalStatus = (type: string, value: string): { color: string; status: string } => {
    const val = parseFloat(value);
    
    switch (type) {
      case "systolic":
        if (val < 90) return { color: "text-blue-600", status: "ต่ำ" };
        if (val < 120) return { color: "text-green-600", status: "ปกติ" };
        if (val < 140) return { color: "text-yellow-600", status: "สูง" };
        return { color: "text-red-600", status: "สูงมาก" };
      
      case "diastolic":
        if (val < 60) return { color: "text-blue-600", status: "ต่ำ" };
        if (val < 80) return { color: "text-green-600", status: "ปกติ" };
        if (val < 90) return { color: "text-yellow-600", status: "สูง" };
        return { color: "text-red-600", status: "สูงมาก" };
      
      case "heartRate":
        if (val < 60) return { color: "text-blue-600", status: "ช้า" };
        if (val <= 100) return { color: "text-green-600", status: "ปกติ" };
        return { color: "text-red-600", status: "เร็ว" };
      
      case "temperature":
        if (val < 36) return { color: "text-blue-600", status: "ต่ำ" };
        if (val <= 37.5) return { color: "text-green-600", status: "ปกติ" };
        return { color: "text-red-600", status: "ไม่ปกติ" };
      
      default:
        return { color: "text-slate-600", status: "" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">วัดสัญญาณชีพ</h1>
              <p className="text-gray-600">บันทึกสัญญาณชีพของผู้ป่วย</p>
            </div>
          </div>
        </div>
      
      <div className="space-y-4 md:space-y-6">
        {/* Patient Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
              ค้นหาผู้ป่วยในคิว
            </h2>
            <p className="text-slate-600">ค้นหาด้วยหมายเลขคิวหรือ HN เพื่อบันทึกสัญญาณชีพ</p>
          </div>

          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="queue"
                  checked={searchType === "queue"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลขคิว</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลข HN</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder={searchType === "queue" ? "Q001" : "HN2025001"}
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSearching || !searchQuery.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    ค้นหา...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    ค้นหา
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-pink-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-pink-800 font-medium">ผู้ป่วยในคิว</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Row 1: Basic Info */}
                <div>
                  <span className="text-slate-600">คิว:</span>
                  <span className="ml-2 font-bold text-pink-600 text-lg">{selectedPatient.queueNumber}</span>
                </div>
                <div>
                  <span className="text-slate-600">HN:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.hn}</span>
                </div>
                <div>
                  <span className="text-slate-600">เพศ:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {selectedPatient.gender === 'male' ? 'ชาย' : 
                     selectedPatient.gender === 'female' ? 'หญิง' : 
                     selectedPatient.gender || 'ไม่ระบุ'}
                  </span>
                </div>

                {/* Row 2: Name */}
                <div className="md:col-span-2">
                  <span className="text-slate-600">ชื่อ-นามสกุล (ไทย):</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {selectedPatient.thaiName && selectedPatient.thaiLastName 
                      ? `${selectedPatient.thaiName} ${selectedPatient.thaiLastName}`
                      : selectedPatient.thaiName || 'ไม่ระบุ'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">อายุ:</span>
                  <span className="ml-2 font-medium text-slate-800">{calculateAge(selectedPatient.birthDate, selectedPatient)} ปี</span>
                </div>

                {/* Row 3: Medical Info */}
                <div>
                  <span className="text-slate-600">กรุ๊ปเลือด:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.bloodType || 'ไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="text-slate-600">น้ำหนัก:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} กก.` : 'ไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="text-slate-600">ส่วนสูง:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.height ? `${selectedPatient.height} ซม.` : 'ไม่ระบุ'}</span>
                </div>

                {/* Row 4: Allergies */}
                <div className="md:col-span-3">
                  <span className="text-slate-600">อาการแพ้:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {[selectedPatient.drugAllergies, selectedPatient.foodAllergies]
                      .filter(Boolean)
                      .join(', ') || 'ไม่มี'}
                  </span>
                </div>

                {/* Row 5: Medical History */}
                <div className="md:col-span-3">
                  <span className="text-slate-600">โรคประจำตัว:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.chronicDiseases || 'ไม่มี'}</span>
                </div>

                {/* Row 6: Current Medications */}
                <div className="md:col-span-3">
                  <span className="text-slate-600">ยาที่ใช้อยู่:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.currentMedications || 'ไม่มี'}</span>
                </div>

                {/* Row 7: Visit Info */}
                <div>
                  <span className="text-slate-600">ประเภท:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.treatmentType}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-600">แพทย์:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.assignedDoctor}</span>
                </div>

                {/* Row 8: Date & Time */}
                <div className="md:col-span-3">
                  <span className="text-slate-600">วันที่และเวลา:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {(() => {
                      // ใช้เวลาปัจจุบันแทนข้อมูลจาก backend เพื่อให้แสดงผลถูกต้อง
                      const now = new Date();
                      const buddhistYear = now.getFullYear() + 543;
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const hours = String(now.getHours()).padStart(2, '0');
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      const seconds = String(now.getSeconds()).padStart(2, '0');
                      
                      return `${day}/${month}/${buddhistYear} ${hours}:${minutes}:${seconds}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Medical Summary */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                ข้อมูลทางการแพทย์ที่สำคัญ
              </h2>
              <p className="text-slate-600">ข้อมูลที่ควรพิจารณาในการวัดสัญญาณชีพ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Medical Alerts */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  ข้อมูลที่ต้องระวัง
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-red-700">อาการแพ้ยา:</span>
                    <span className="ml-2 text-red-600">{selectedPatient.drugAllergies || 'ไม่มี'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">อาการแพ้อาหาร:</span>
                    <span className="ml-2 text-red-600">{selectedPatient.foodAllergies || 'ไม่มี'}</span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  ประวัติทางการแพทย์
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">โรคประจำตัว:</span>
                    <span className="ml-2 text-blue-600">{selectedPatient.chronicDiseases || 'ไม่มี'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">ยาที่ใช้อยู่:</span>
                    <span className="ml-2 text-blue-600">{selectedPatient.currentMedications || 'ไม่มี'}</span>
                  </div>
                </div>
              </div>

              {/* Physical Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                  <Weight className="h-4 w-4 mr-1" />
                  ข้อมูลร่างกาย
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-700">กรุ๊ปเลือด:</span>
                    <span className="ml-2 text-green-600">{selectedPatient.bloodType || 'ไม่ระบุ'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">น้ำหนักเดิม:</span>
                    <span className="ml-2 text-green-600">{selectedPatient.weight ? `${selectedPatient.weight} กก.` : 'ไม่ระบุ'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">ส่วนสูงเดิม:</span>
                    <span className="ml-2 text-green-600">{selectedPatient.height ? `${selectedPatient.height} ซม.` : 'ไม่ระบุ'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Risk Assessment Section */}
        {selectedPatient && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-800">AI Risk Assessment</h3>
                <p className="text-blue-600">การประเมินความเสี่ยงโรคเบาหวานด้วย AI</p>
              </div>
            </div>

            {loadingRisk ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-blue-600">กำลังโหลดข้อมูลความเสี่ยง...</span>
              </div>
            ) : riskError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{riskError}</span>
                </div>
              </div>
            ) : aiRiskData ? (
              <div className="space-y-6">
                {/* Risk Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Risk Score */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Risk Score</div>
                    <div className="text-3xl font-bold text-blue-600">{aiRiskData.diabetesRisk.riskScore}/100</div>
                    <div className="text-xs text-gray-500 mt-1">คะแนนความเสี่ยง</div>
                  </div>
                  
                  {/* Risk Level */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                    <div className={`text-xl font-bold px-3 py-1 rounded-full inline-block ${getRiskColor(aiRiskData.diabetesRisk.riskLevel)}`}>
                      {getRiskLevelThai(aiRiskData.diabetesRisk.riskLevel)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">ระดับความเสี่ยง</div>
                  </div>
                  
                  {/* Risk Percentage */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Risk Percentage</div>
                    <div className="text-2xl font-bold text-orange-600">{aiRiskData.diabetesRisk.riskPercentage}%</div>
                    <div className="text-xs text-gray-500 mt-1">โอกาสเป็นเบาหวานใน 10 ปี</div>
                  </div>
                </div>

                {/* Contributing Factors */}
                {aiRiskData.diabetesRisk.contributingFactors && aiRiskData.diabetesRisk.contributingFactors.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">ปัจจัยที่ส่งผลต่อความเสี่ยง:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiRiskData.diabetesRisk.contributingFactors.map((factor, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiRiskData.diabetesRisk.recommendations && aiRiskData.diabetesRisk.recommendations.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">คำแนะนำ:</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {aiRiskData.diabetesRisk.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assessment Info */}
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">วันที่ประเมิน:</span>
                      <span className="ml-2 font-medium text-gray-800">
                        {new Date().toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ประเมินโดย:</span>
                      <span className="ml-2 font-medium text-gray-800">AI System</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>ยังไม่มีข้อมูลการประเมินความเสี่ยง</p>
                <p className="text-sm">ข้อมูลจะแสดงเมื่อมีการประเมินความเสี่ยงแล้ว</p>
              </div>
            )}
          </div>
        )}

        {/* Vital Signs Form */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                บันทึกสัญญาณชีพ
              </h2>
              <p className="text-slate-600">กรุณาวัดและบันทึกสัญญาณชีพของผู้ป่วยให้ครบถ้วน</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
              {/* Weight, Height & BMI */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">น้ำหนัก ส่วนสูง และ BMI</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      น้ำหนัก (กก.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalSigns.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.weight ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="65.5"
                    />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ส่วนสูง (ซม.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalSigns.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.height ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="170.0"
                    />
                    {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      BMI
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.bmi}
                      readOnly
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                      placeholder="--"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมวดหมู่ BMI
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.bmiCategory}
                      readOnly
                      className={`w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 font-medium ${getBMIColor(vitalSigns.bmiCategory)}`}
                      placeholder="--"
                    />
                  </div>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="border-t pt-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600 font-semibold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">ความดันโลหิต</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Systolic (mmHg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.systolicBP}
                      onChange={(e) => handleInputChange("systolicBP", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.systolicBP ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="120"
                    />
                    {errors.systolicBP && <p className="text-red-500 text-sm mt-1">{errors.systolicBP}</p>}
                    {vitalSigns.systolicBP && (
                      <p className={`text-sm mt-1 ${getVitalStatus("systolic", vitalSigns.systolicBP).color}`}>
                        {getVitalStatus("systolic", vitalSigns.systolicBP).status}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Diastolic (mmHg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.diastolicBP}
                      onChange={(e) => handleInputChange("diastolicBP", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.diastolicBP ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="80"
                    />
                    {errors.diastolicBP && <p className="text-red-500 text-sm mt-1">{errors.diastolicBP}</p>}
                    {vitalSigns.diastolicBP && (
                      <p className={`text-sm mt-1 ${getVitalStatus("diastolic", vitalSigns.diastolicBP).color}`}>
                        {getVitalStatus("diastolic", vitalSigns.diastolicBP).status}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      สรุป BP
                    </label>
                    <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-800">
                        {vitalSigns.systolicBP && vitalSigns.diastolicBP 
                          ? `${vitalSigns.systolicBP}/${vitalSigns.diastolicBP}` 
                          : "--/--"
                        }
                      </span>
                      <span className="text-slate-600 ml-2">mmHg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Vital Signs */}
              <div className="border-t pt-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">สัญญาณชีพอื่นๆ</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ชีพจร (ครั้ง/นาที) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.heartRate}
                      onChange={(e) => handleInputChange("heartRate", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.heartRate ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="72"
                    />
                    {errors.heartRate && <p className="text-red-500 text-sm mt-1">{errors.heartRate}</p>}
                    {vitalSigns.heartRate && (
                      <p className={`text-sm mt-1 ${getVitalStatus("heartRate", vitalSigns.heartRate).color}`}>
                        {getVitalStatus("heartRate", vitalSigns.heartRate).status}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      อุณหภูมิ (°C) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalSigns.temperature}
                      onChange={(e) => handleInputChange("temperature", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.temperature ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="36.5"
                    />
                    {errors.temperature && <p className="text-red-500 text-sm mt-1">{errors.temperature}</p>}
                    {vitalSigns.temperature && (
                      <p className={`text-sm mt-1 ${getVitalStatus("temperature", vitalSigns.temperature).color}`}>
                        {getVitalStatus("temperature", vitalSigns.temperature).status}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      อัตราการหายใจ (ครั้ง/นาที) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.respiratoryRate}
                      onChange={(e) => handleInputChange("respiratoryRate", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.respiratoryRate ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="18"
                    />
                    {errors.respiratoryRate && <p className="text-red-500 text-sm mt-1">{errors.respiratoryRate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Oxygen Saturation (%)
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.oxygenSaturation}
                      onChange={(e) => handleInputChange("oxygenSaturation", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="98"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ระดับน้ำตาลในเลือด (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.bloodSugar}
                      onChange={(e) => handleInputChange("bloodSugar", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ระดับความเจ็บปวด (0-10)
                    </label>
                    <select
                      value={vitalSigns.painLevel}
                      onChange={(e) => handleInputChange("painLevel", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">เลือกระดับ</option>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <option key={level} value={level}>{level} - {level === 0 ? "ไม่เจ็บ" : level <= 3 ? "เจ็บเล็กน้อย" : level <= 6 ? "เจ็บปานกลาง" : "เจ็บมาก"}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* General Assessment */}
              <div className="border-t pt-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-semibold">4</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">การประเมินเบื้องต้น</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      สถานะเบื้องต้น <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: "normal", label: "ปกติ", color: "green", icon: "✅" },
                        { value: "abnormal", label: "ผิดปกติ", color: "red", icon: "⚠️" },
                        { value: "urgent", label: "ต้องการความสนใจเร่งด่วน", color: "orange", icon: "🚨" }
                      ].map((status) => (
                        <label
                          key={status.value}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            vitalSigns.generalCondition === status.value
                              ? `border-${status.color}-500 bg-${status.color}-50`
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value={status.value}
                            checked={vitalSigns.generalCondition === status.value}
                            onChange={(e) => handleInputChange("generalCondition", e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center w-full">
                            <span className="text-2xl mr-3">{status.icon}</span>
                            <span className="font-medium text-slate-800">{status.label}</span>
                          </div>
                          {vitalSigns.generalCondition === status.value && (
                            <div className="absolute top-2 right-2">
                              <svg className={`w-5 h-5 text-${status.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.generalCondition && <p className="text-red-500 text-sm mt-2">{errors.generalCondition}</p>}
                  </div>

                  {/* Additional AI Analysis Fields */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                        <Activity className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-800">ข้อมูลเพิ่มเติมสำหรับ AI Analysis</h3>
                        <p className="text-blue-600">ข้อมูลทางกายภาพและจิตใจเพื่อการวิเคราะห์ที่แม่นยำ</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Body Composition */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">องค์ประกอบร่างกาย</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              เปอร์เซ็นต์ไขมันในร่างกาย (%)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.bodyFatPercentage}
                              onChange={(e) => handleInputChange("bodyFatPercentage", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 25.5"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              มวลกล้ามเนื้อ (กก.)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.muscleMass}
                              onChange={(e) => handleInputChange("muscleMass", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 45.2"
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              ความหนาแน่นของกระดูก
                            </label>
                            <select
                              value={vitalSigns.boneDensity}
                              onChange={(e) => handleInputChange("boneDensity", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">เลือก</option>
                              <option value="normal">ปกติ</option>
                              <option value="osteopenia">กระดูกบาง</option>
                              <option value="osteoporosis">กระดูกพรุน</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              ความหนาของผิวหนัง (มม.)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.skinFoldThickness}
                              onChange={(e) => handleInputChange("skinFoldThickness", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 15.5"
                              min="0"
                              step="0.1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Health Status */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">สถานะสุขภาพ</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              สถานะการดื่มน้ำ
                            </label>
                            <select
                              value={vitalSigns.hydrationStatus}
                              onChange={(e) => handleInputChange("hydrationStatus", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">เลือก</option>
                              <option value="good">ดี</option>
                              <option value="moderate">ปานกลาง</option>
                              <option value="poor">ไม่ดี</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              คุณภาพการนอน (1-10)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.sleepQuality}
                              onChange={(e) => handleInputChange("sleepQuality", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 7"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              ระดับความเครียด (1-10)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.stressLevel}
                              onChange={(e) => handleInputChange("stressLevel", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 5"
                              min="1"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mental Health Assessment */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">การประเมินสุขภาพจิต</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              คะแนนภาวะซึมเศร้า (0-27)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.depressionScore}
                              onChange={(e) => handleInputChange("depressionScore", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 8"
                              min="0"
                              max="27"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              ระดับความวิตกกังวล (1-10)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.anxietyLevel}
                              onChange={(e) => handleInputChange("anxietyLevel", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 4"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              คะแนนคุณภาพชีวิต (0-100)
                            </label>
                            <input
                              type="number"
                              value={vitalSigns.qualityOfLifeScore}
                              onChange={(e) => handleInputChange("qualityOfLifeScore", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="เช่น 75"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        เวลาที่วัด
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                        {currentTime}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        เวลาปัจจุบันประเทศไทย (อัปเดตอัตโนมัติ)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ผู้วัด
                      </label>
                      <input
                        type="text"
                        value={vitalSigns.measuredBy}
                        onChange={(e) => handleInputChange("measuredBy", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="ชื่อพยาบาล"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมายเหตุ
                    </label>
                    <textarea
                      value={vitalSigns.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="หมายเหตุเพิ่มเติม หรือข้อสังเกต"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-8">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      isSubmitting
                        ? 'bg-pink-400 text-white cursor-not-allowed'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        กำลังบันทึก...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        บันทึกสัญญาณชีพ
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg animate-in slide-in-from-top-2 duration-300 relative overflow-hidden">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 h-1 bg-green-300 animate-pulse"></div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm text-green-800">
                    <pre className="whitespace-pre-wrap font-medium leading-relaxed">{success}</pre>
                  </div>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => setSuccess(null)}
                      className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm text-red-800">
                    <p className="font-medium leading-relaxed">{error}</p>
                  </div>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 bg-pink-50 border border-pink-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-pink-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-pink-800">
                <p className="font-medium mb-1">คำแนะนำการวัดสัญญาณชีพ:</p>
                <ul className="space-y-1 text-pink-700">
                  <li>• วัดน้ำหนักและส่วนสูงเพื่อคำนวณ BMI อัตโนมัติ</li>
                  <li>• ระบบจะแสดงสถานะปกติ/ไม่ปกติของแต่ละค่า</li>
                  <li>• ข้อมูลที่มี (*) เป็นข้อมูลที่จำเป็นต้องกรอก</li>
                  <li>• หลังบันทึกเสร็จผู้ป่วยจะพร้อมเข้าพบแพทย์</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
