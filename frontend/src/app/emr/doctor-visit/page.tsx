"use client";
import { useState, useEffect } from "react";
import { Search, Stethoscope, CheckCircle, AlertCircle, User, Heart, Activity, FileText, Brain, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { DoctorVisitService } from '@/services/doctorVisitService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { AIDashboardService, PatientDiabetesRiskDetail } from '@/services/aiDashboardService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

export default function DoctorVisit() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Risk Assessment states
  const [aiRiskData, setAiRiskData] = useState<PatientDiabetesRiskDetail | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

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
  const [success, setSuccess] = useState<string | null>(null);

  // Update examinedBy when user changes
  useEffect(() => {
    if (user) {
      const doctorName = user.thaiName || `${user.firstName} ${user.lastName}` || "แพทย์";
      setDoctorVisitData(prev => ({
        ...prev,
        examinedBy: doctorName
      }));
    }
  }, [user]);

  // Load AI risk assessment when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientRisk(selectedPatient.id);
    } else {
      setAiRiskData(null);
      setRiskError(null);
    }
  }, [selectedPatient]);

  const [doctorVisitData, setDoctorVisitData] = useState({
    chiefComplaint: '',
    presentIllness: '',
    physicalExamination: {
      generalAppearance: '',
      vitalSigns: '',
      headNeck: '',
      chest: '',
      cardiovascular: '',
      abdomen: '',
      extremities: '',
      neurological: '',
      other: ''
    },
    diagnosis: {
      primaryDiagnosis: '',
      secondaryDiagnosis: [],
      differentialDiagnosis: [],
      icd10Code: ''
    },
    treatmentPlan: {
      medications: [],
      procedures: [],
      lifestyleModifications: [],
      followUpInstructions: ''
    },
    advice: '',
    followUp: {
      scheduledDate: '',
      interval: '',
      purpose: '',
      notes: ''
    },
    notes: '',
    examinedTime: new Date().toISOString().slice(0, 16),
    examinedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "แพทย์",
    // AI Research Fields
    aiResearchData: {
      symptomSeverity: '', // ระดับความรุนแรงของอาการ (1-10)
      symptomDuration: '', // ระยะเวลาที่มีอาการ
      symptomPattern: '', // รูปแบบของอาการ (เฉียบพลัน, เรื้อรัง, เป็นๆ หายๆ)
      riskFactors: '', // ปัจจัยเสี่ยง
      familyHistoryRelevant: '', // ประวัติครอบครัวที่เกี่ยวข้อง
      lifestyleFactors: '', // ปัจจัยวิถีชีวิตที่เกี่ยวข้อง
      environmentalFactors: '', // ปัจจัยสิ่งแวดล้อม
      previousTreatmentResponse: '', // การตอบสนองต่อการรักษาเดิม
      comorbidities: '', // โรคประจำตัวที่เกี่ยวข้อง
      medicationHistory: '', // ประวัติการใช้ยา
      allergyHistory: '', // ประวัติการแพ้
      socialHistory: '', // ประวัติสังคมที่เกี่ยวข้อง
      psychologicalFactors: '', // ปัจจัยทางจิตใจ
      qualityOfLife: '', // คุณภาพชีวิต
      functionalStatus: '', // สถานะการทำงาน
      prognosis: '', // การพยากรณ์โรค
      treatmentGoals: '', // เป้าหมายการรักษา
      patientCompliance: '', // การปฏิบัติตามคำแนะนำ
      followUpNeeds: '', // ความต้องการติดตาม
      researchNotes: '' // หมายเหตุสำหรับการวิจัย
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = DoctorVisitService.formatDoctorVisitDataForAPI(
        doctorVisitData,
        selectedPatient.id,
        user?.id || 'system'
      );
      
      const response = await DoctorVisitService.createDoctorVisit(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกการตรวจโดยแพทย์สำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reset form
        setDoctorVisitData({
          chiefComplaint: '',
          presentIllness: '',
          physicalExamination: {
            generalAppearance: '',
            vitalSigns: '',
            headNeck: '',
            chest: '',
            cardiovascular: '',
            abdomen: '',
            extremities: '',
            neurological: '',
            other: ''
          },
          diagnosis: {
            primaryDiagnosis: '',
            secondaryDiagnosis: [],
            differentialDiagnosis: [],
            icd10Code: ''
          },
          treatmentPlan: {
            medications: [],
            procedures: [],
            lifestyleModifications: [],
            followUpInstructions: ''
          },
          advice: '',
          followUp: {
            scheduledDate: '',
            interval: '',
            purpose: '',
            notes: ''
          },
          notes: '',
          examinedTime: new Date().toISOString().slice(0, 16),
          examinedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "แพทย์",
          // Reset AI Research Data
          aiResearchData: {
            symptomSeverity: '',
            symptomDuration: '',
            symptomPattern: '',
            riskFactors: '',
            familyHistoryRelevant: '',
            lifestyleFactors: '',
            environmentalFactors: '',
            previousTreatmentResponse: '',
            comorbidities: '',
            medicationHistory: '',
            allergyHistory: '',
            socialHistory: '',
            psychologicalFactors: '',
            qualityOfLife: '',
            functionalStatus: '',
            prognosis: '',
            treatmentGoals: '',
            patientCompliance: '',
            followUpNeeds: '',
            researchNotes: ''
          }
        });
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกการตรวจ");
      }
    } catch (error) {
      logger.error("Error saving doctor visit:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกการตรวจ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, visitRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName && patient.thaiLastName 
          ? `${patient.thaiName} ${patient.thaiLastName}`
          : patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'doctor_visit',
        recordId: visitRecord.id,
        chiefComplaint: visitRecord.chiefComplaint,
        recordedBy: visitRecord.examinedBy,
        recordedTime: visitRecord.examinedTime,
        message: `มีการบันทึกการตรวจโดยแพทย์ใหม่สำหรับคุณ ${patient.thaiName && patient.thaiLastName ? `${patient.thaiName} ${patient.thaiLastName}` : patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${visitRecord.examinedBy}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for doctor visit', {
        patientHn: notificationData.patientHn,
        recordId: visitRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for doctor visit:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบตรวจโดยแพทย์</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, visitData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'doctor_visit',
        visitData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName && patient.thaiLastName 
            ? `${patient.thaiName} ${patient.thaiLastName}`
            : patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      logger.info('Patient document created successfully for doctor visit', { 
        patientHn: patient.hn,
        recordType: 'doctor_visit'
      });
    } catch (error) {
      logger.error('Error creating patient document for doctor visit:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกการตรวจ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ตรวจโดยแพทย์</h1>
              <p className="text-gray-600">บันทึกการตรวจและวินิจฉัยของแพทย์</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-4 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchType("hn")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    searchType === "hn" 
                      ? "bg-blue-600 text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ค้นหาด้วย HN
                </button>
                <button
                  onClick={() => setSearchType("queue")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    searchType === "queue" 
                      ? "bg-blue-600 text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ค้นหาด้วยคิว
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN (เช่น HN250001)" : "กรอกหมายเลขคิว (เช่น V2025090007)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Comprehensive Patient Information */}
          {selectedPatient && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-800">ข้อมูลผู้ป่วยสำหรับการตรวจ</h3>
                  <p className="text-blue-600">ข้อมูลครบถ้วนเพื่อการวินิจฉัยและการรักษา</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">HN:</span>
                      <span className="font-bold text-blue-600">{selectedPatient.hn || selectedPatient.hospitalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ชื่อ-นามสกุล:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.thaiName && selectedPatient.thaiLastName
                          ? `${selectedPatient.thaiName} ${selectedPatient.thaiLastName}`
                          : selectedPatient.thaiName || selectedPatient.firstName
                          ? `${selectedPatient.thaiName || selectedPatient.firstName} ${selectedPatient.thaiLastName || selectedPatient.lastName || ''}`.trim()
                          : 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">อายุ:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.birthDate ? calculateAge(selectedPatient.birthDate) : 'ไม่ระบุ'} ปี
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">เพศ:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.gender === 'male' ? 'ชาย' : 
                         selectedPatient.gender === 'female' ? 'หญิง' : 
                         selectedPatient.gender || 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">กรุ๊ปเลือด:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.bloodType || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-lg p-4 border border-red-100">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    ข้อมูลทางการแพทย์
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้ยา:</span>
                      <span className="font-medium text-red-600">{selectedPatient.drugAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้อาหาร:</span>
                      <span className="font-medium text-red-600">{selectedPatient.foodAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">โรคประจำตัว:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.chronicDiseases || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ยาที่ใช้อยู่:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.currentMedications || 'ไม่มี'}</span>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    สัญญาณชีพล่าสุด
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">น้ำหนัก:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} กก.` : 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ส่วนสูง:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.height ? `${selectedPatient.height} ซม.` : 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">BMI:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.weight && selectedPatient.height 
                          ? (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)).toFixed(1)
                          : 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">สถานะ:</span>
                      <span className="font-medium text-green-600">พร้อมตรวจ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History Summary */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  สรุปประวัติทางการแพทย์
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">ประวัติการรักษา:</span>
                    <p className="text-slate-800 mt-1">{selectedPatient.medicalHistory || 'ไม่มีข้อมูล'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">ประวัติการผ่าตัด:</span>
                    <p className="text-slate-800 mt-1">ไม่มีข้อมูล</p>
                  </div>
                </div>
              </div>

              {/* Instructions for Doctor */}
              <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">คำแนะนำสำหรับแพทย์:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• ตรวจสอบประวัติแพ้ยาและอาหารก่อนให้การรักษา</li>
                      <li>• พิจารณาโรคประจำตัวและยาที่ใช้อยู่ในการวินิจฉัย</li>
                      <li>• ใช้ข้อมูลสัญญาณชีพในการประเมินอาการ</li>
                      <li>• บันทึกข้อมูลให้ครบถ้วนเพื่อการวิจัยและพัฒนาระบบ AI</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Risk Assessment Section */}
          {selectedPatient && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
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

          {/* Doctor Visit Form */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อาการหลัก (Chief Complaint) *
                </label>
                <textarea
                  value={doctorVisitData.chiefComplaint}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกอาการหลักของผู้ป่วย"
                />
              </div>

              {/* Present Illness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประวัติการเจ็บป่วยปัจจุบัน (Present Illness) *
                </label>
                <textarea
                  value={doctorVisitData.presentIllness}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, presentIllness: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="กรอกรายละเอียดประวัติการเจ็บป่วยปัจจุบัน"
                />
              </div>

              {/* Physical Examination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การตรวจร่างกาย (Physical Examination)
                </label>
                <textarea
                  value={doctorVisitData.physicalExamination.generalAppearance}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    physicalExamination: { ...prev.physicalExamination, generalAppearance: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="กรอกผลการตรวจร่างกาย"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การวินิจฉัย (Diagnosis) *
                </label>
                <input
                  type="text"
                  value={doctorVisitData.diagnosis.primaryDiagnosis}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    diagnosis: { ...prev.diagnosis, primaryDiagnosis: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกการวินิจฉัยหลัก"
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แผนการรักษา (Treatment Plan)
                </label>
                <textarea
                  value={doctorVisitData.treatmentPlan.followUpInstructions}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    treatmentPlan: { ...prev.treatmentPlan, followUpInstructions: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกแผนการรักษา"
                />
              </div>

              {/* Advice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำ (Advice) *
                </label>
                <textarea
                  value={doctorVisitData.advice}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, advice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกคำแนะนำสำหรับผู้ป่วย"
                />
              </div>

              {/* AI Research Data Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800">ข้อมูลสำหรับ AI และการวิจัย</h3>
                    <p className="text-purple-600">ข้อมูลเพิ่มเติมเพื่อการพัฒนาระบบ AI และการวิจัยทางการแพทย์</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Symptom Analysis */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">การวิเคราะห์อาการ</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ระดับความรุนแรงของอาการ (1-10)
                        </label>
                        <select
                          value={doctorVisitData.aiResearchData.symptomSeverity}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, symptomSeverity: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกระดับ</option>
                          {[1,2,3,4,5,6,7,8,9,10].map(level => (
                            <option key={level} value={level}>{level} - {level <= 3 ? 'น้อย' : level <= 6 ? 'ปานกลาง' : level <= 8 ? 'มาก' : 'รุนแรงมาก'}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ระยะเวลาที่มีอาการ
                        </label>
                        <select
                          value={doctorVisitData.aiResearchData.symptomDuration}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, symptomDuration: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกระยะเวลา</option>
                          <option value="acute">เฉียบพลัน (&lt; 1 สัปดาห์)</option>
                          <option value="subacute">กึ่งเฉียบพลัน (1-4 สัปดาห์)</option>
                          <option value="chronic">เรื้อรัง (&gt; 4 สัปดาห์)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          รูปแบบของอาการ
                        </label>
                        <select
                          value={doctorVisitData.aiResearchData.symptomPattern}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, symptomPattern: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกรูปแบบ</option>
                          <option value="continuous">ต่อเนื่อง</option>
                          <option value="intermittent">เป็นๆ หายๆ</option>
                          <option value="progressive">แย่ลงเรื่อยๆ</option>
                          <option value="stable">คงที่</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors & Prognosis */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">ปัจจัยเสี่ยงและการพยากรณ์</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ปัจจัยเสี่ยงที่สำคัญ
                        </label>
                        <textarea
                          value={doctorVisitData.aiResearchData.riskFactors}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, riskFactors: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น อายุ, โรคประจำตัว, พฤติกรรมเสี่ยง"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          การพยากรณ์โรค
                        </label>
                        <select
                          value={doctorVisitData.aiResearchData.prognosis}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, prognosis: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกการพยากรณ์</option>
                          <option value="excellent">ดีมาก</option>
                          <option value="good">ดี</option>
                          <option value="fair">ปานกลาง</option>
                          <option value="poor">ไม่ดี</option>
                          <option value="guarded">ต้องติดตามใกล้ชิด</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          คุณภาพชีวิต
                        </label>
                        <select
                          value={doctorVisitData.aiResearchData.qualityOfLife}
                          onChange={(e) => setDoctorVisitData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, qualityOfLife: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกคุณภาพชีวิต</option>
                          <option value="excellent">ดีมาก</option>
                          <option value="good">ดี</option>
                          <option value="fair">ปานกลาง</option>
                          <option value="poor">ไม่ดี</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional AI Research Fields */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ปัจจัยวิถีชีวิตที่เกี่ยวข้อง
                    </label>
                    <textarea
                      value={doctorVisitData.aiResearchData.lifestyleFactors}
                      onChange={(e) => setDoctorVisitData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, lifestyleFactors: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น การออกกำลังกาย, การนอน, ความเครียด"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ปัจจัยทางจิตใจ
                    </label>
                    <textarea
                      value={doctorVisitData.aiResearchData.psychologicalFactors}
                      onChange={(e) => setDoctorVisitData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, psychologicalFactors: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น ความเครียด, ความวิตกกังวล, อาการซึมเศร้า"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    หมายเหตุสำหรับการวิจัย
                  </label>
                  <textarea
                    value={doctorVisitData.aiResearchData.researchNotes}
                    onChange={(e) => setDoctorVisitData(prev => ({
                      ...prev,
                      aiResearchData: { ...prev.aiResearchData, researchNotes: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="ข้อมูลเพิ่มเติมที่สำคัญสำหรับการวิจัยและพัฒนาระบบ AI"
                  />
                </div>

                <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">ประโยชน์ของข้อมูล AI Research:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• ช่วยพัฒนาระบบ AI ในการคาดการณ์โรคและแนะนำการรักษา</li>
                        <li>• ใช้ในการวิจัยเพื่อหาความสัมพันธ์ระหว่างปัจจัยต่างๆ กับโรค</li>
                        <li>• ปรับปรุงคุณภาพการดูแลผู้ป่วยในอนาคต</li>
                        <li>• สร้างฐานข้อมูลสำหรับการวิเคราะห์แนวโน้มสุขภาพ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !doctorVisitData.chiefComplaint || !doctorVisitData.presentIllness || !doctorVisitData.diagnosis.primaryDiagnosis || !doctorVisitData.advice}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการตรวจ"}
                </button>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 whitespace-pre-line">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}