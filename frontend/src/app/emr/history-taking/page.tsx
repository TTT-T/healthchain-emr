"use client";
import { useState } from "react";
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { HistoryTakingService } from '@/services/historyTakingService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { getCurrentThailandDateTimeLocal } from '@/utils/thailandTime';

interface Patient {
  hn: string;
  nationalId: string;
  thaiName: string;
  gender: string;
  birth_date: string;
  queueNumber: string;
  treatmentType: string;
  assignedDoctor: string;
  vitalSigns?: {
    weight: string;
    height: string;
    bmi: string;
    systolic_bp: string;
    diastolic_bp: string;
    temperature: string;
    heart_rate: string;
    general_condition: string;
  };
}

interface MedicalHistory {
  chiefComplaint: string;
  hpi: string;
  pmh: {
    previousIllness: string;
    surgicalHistory: string;
    hospitalization: string;
  };
  drugAllergy: {
    hasAllergy: string;
    allergyDetails: string;
  };
  currentMedications: string;
  familyHistory: {
    diabetes: boolean;
    hypertension: boolean;
    heartDisease: boolean;
    cancer: boolean;
    other: string;
  };
  socialHistory: {
    smoking: string;
    alcohol: string;
    occupation: string;
    exercise: string;
    other: string;
  };
  pregnancyHistory?: {
    hasBeenPregnant: boolean;
    gestationalDiabetes: boolean;
    polycysticOvarySyndrome: boolean;
    numberOfPregnancies: string;
    largestBabyWeight: string;
    pregnancyComplications: string;
  };
  dietaryHistory: {
    dailySugarIntake: string;
    processedFoodFrequency: string;
    fruitVegetableServings: string;
    fastFoodFrequency: string;
    mealFrequency: string;
  };
  lifestyleFactors: {
    sleepDuration: string;
    sleepQuality: string;
    stressLevel: string;
    physicalActivityDetails: string;
    sedentaryHours: string;
  };
  reviewOfSystems: {
    general: string;
    cardiovascular: string;
    respiratory: string;
    gastroininal: string;
    genitourinary: string;
    neurological: string;
    musculoskeletal: string;
    dermatological: string;
  };
  recordedBy: string;
  recordedTime: string;
  notes: string;
}

export default function HistoryTaking() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("cc");
  
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    chiefComplaint: "",
    hpi: "",
    pmh: {
      previousIllness: "",
      surgicalHistory: "",
      hospitalization: ""
    },
    drugAllergy: {
      hasAllergy: "no",
      allergyDetails: ""
    },
    currentMedications: "",
    familyHistory: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      cancer: false,
      other: ""
    },
    socialHistory: {
      smoking: "never",
      alcohol: "never",
      occupation: "",
      exercise: "none",
      other: ""
    },
    pregnancyHistory: {
      hasBeenPregnant: false,
      gestationalDiabetes: false,
      polycysticOvarySyndrome: false,
      numberOfPregnancies: "",
      largestBabyWeight: "",
      pregnancyComplications: ""
    },
    dietaryHistory: {
      dailySugarIntake: "moderate",
      processedFoodFrequency: "sometimes",
      fruitVegetableServings: "",
      fastFoodFrequency: "monthly",
      mealFrequency: "3"
    },
    lifestyleFactors: {
      sleepDuration: "",
      sleepQuality: "good",
      stressLevel: "moderate",
      physicalActivityDetails: "",
      sedentaryHours: ""
    },
    reviewOfSystems: {
      general: "",
      cardiovascular: "",
      respiratory: "",
      gastroininal: "",
      genitourinary: "",
      neurological: "",
      musculoskeletal: "",
      dermatological: ""
    },
    recordedBy: "นพ.สมชาย วงศ์แพทย์",
    recordedTime: getCurrentThailandDateTimeLocal(),
    notes: ""
  });

  const [errors, setErrors] = useState<any>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSelectedPatient(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        // Find exact match
        const exactMatch = response.data.find((p: any) =>
          searchType === "hn" ? p.hn === searchQuery : p.hn === searchQuery
        );
        
        if (exactMatch) {
          setSelectedPatient(exactMatch);
          setSuccess("พบข้อมูลผู้ป่วยแล้ว");
        } else {
          setError("ไม่พบข้อมูลผู้ป่วยในคิว กรุณาตรวจสอบข้อมูล");
        }
      } else {
        setError("ไม่พบข้อมูลผู้ป่วยในคิว กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setMedicalHistory(prev => ({ ...prev, [field]: value }));
    } else if (keys.length === 2) {
      setMedicalHistory(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof MedicalHistory] as any),
          [keys[1]]: value
        }
      }));
    }
    
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!selectedPatient) {
      alert("กรุณาเลือกผู้ป่วย");
      return false;
    }

    // Required fields
    if (!medicalHistory.chiefComplaint.trim()) {
      newErrors.chiefComplaint = "กรุณากรอกอาการสำคัญที่มาพบแพทย์";
    }
    if (!medicalHistory.hpi.trim()) {
      newErrors.hpi = "กรุณากรอกประวัติอาการปัจจุบัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create medical history record using VisitService
      const historyData = {
        patientId: selectedPatient!.id,
        chiefComplaint: medicalHistory.chiefComplaint,
        presentIllness: medicalHistory.hpi,
        pastMedicalHistory: medicalHistory.pmh.previousIllness,
        surgicalHistory: medicalHistory.pmh.surgicalHistory,
        drugAllergies: medicalHistory.drugAllergy.hasAllergy === 'yes' ? medicalHistory.drugAllergy.allergyDetails : 'ไม่แพ้ยา',
        currentMedications: medicalHistory.currentMedications,
        familyHistory: JSON.stringify(medicalHistory.familyHistory),
        socialHistory: JSON.stringify(medicalHistory.socialHistory),
        notes: medicalHistory.notes,
        recordedBy: user?.id || 'system'
      };
      
      // Format data for API
      const formattedData = HistoryTakingService.formatHistoryDataForAPI(
        medicalHistory,
        selectedPatient!.id,
        user?.id || 'system'
      );
      
      // Create medical history record using HistoryTakingService
      const response = await HistoryTakingService.createHistoryTaking(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        // Send notification to patient
        await sendPatientNotification(selectedPatient!, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient!, response.data);
        
        setSuccess("บันทึกประวัติผู้ป่วยสำเร็จ! พร้อมสำหรับขั้นตอนการตรวจร่างกาย\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกประวัติผู้ป่วย");
      }
      
      // Reset form
      setTimeout(() => {
        setSelectedPatient(null);
        setSearchQuery("");
        setSuccess(null);
        setMedicalHistory({
          chiefComplaint: "",
          hpi: "",
          pmh: {
            previousIllness: "",
            surgicalHistory: "",
            hospitalization: ""
          },
          drugAllergy: {
            hasAllergy: "no",
            allergyDetails: ""
          },
          currentMedications: "",
          familyHistory: {
            diabetes: false,
            hypertension: false,
            heartDisease: false,
            cancer: false,
            other: ""
          },
          socialHistory: {
            smoking: "never",
            alcohol: "never",
            occupation: "",
            exercise: "none",
            other: ""
          },
          pregnancyHistory: {
            hasBeenPregnant: false,
            gestationalDiabetes: false,
            polycysticOvarySyndrome: false,
            numberOfPregnancies: "",
            largestBabyWeight: "",
            pregnancyComplications: ""
          },
          dietaryHistory: {
            dailySugarIntake: "moderate",
            processedFoodFrequency: "sometimes",
            fruitVegetableServings: "",
            fastFoodFrequency: "monthly",
            mealFrequency: "3"
          },
          lifestyleFactors: {
            sleepDuration: "",
            sleepQuality: "good",
            stressLevel: "moderate",
            physicalActivityDetails: "",
            sedentaryHours: ""
          },
          reviewOfSystems: {
            general: "",
            cardiovascular: "",
            respiratory: "",
            gastroininal: "",
            genitourinary: "",
            neurological: "",
            musculoskeletal: "",
            dermatological: ""
          },
          recordedBy: "นพ.สมชาย วงศ์แพทย์",
          recordedTime: getCurrentThailandDateTimeLocal(),
          notes: ""
        });
      }, 3000);
      
    } catch (error) {
      logger.error("Error saving medical history:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกประวัติ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send notification to patient when history is recorded
  const sendPatientNotification = async (
    patient: MedicalPatient,
    historyRecord: any
  ) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'history_taking',
        recordId: historyRecord.id,
        chiefComplaint: historyRecord.chiefComplaint,
        recordedBy: historyRecord.recordedBy,
        recordedTime: historyRecord.recordedTime,
        message: `มีการบันทึกประวัติการซักประวัติใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for history taking', {
        patientHn: notificationData.patientHn,
        recordId: historyRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for history taking:', error);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const navigationSections = [
    { id: "cc", label: "CC", title: "Chief Complaint", icon: "💬" },
    { id: "hpi", label: "HPI", title: "History of Present Illness", icon: "📋" },
    { id: "pmh", label: "PMH", title: "Past Medical History", icon: "🏥" },
    { id: "drugs", label: "Drugs", title: "Drug Allergy & Medications", icon: "💊" },
    { id: "family", label: "Family", title: "Family History", icon: "👨‍👩‍👧‍👦" },
    { id: "social", label: "Social", title: "Social History", icon: "🌍" },
    ...(selectedPatient?.gender === "female" ? [{ id: "pregnancy", label: "Pregnancy", title: "Pregnancy History", icon: "🤱" }] : []),
    { id: "dietary", label: "Diet", title: "Dietary History", icon: "🍎" },
    { id: "lifestyle", label: "Lifestyle", title: "Lifestyle Factors", icon: "💪" },
    { id: "ros", label: "ROS", title: "Review of Systems", icon: "🔍" }
  ];

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, historyData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'history_taking',
        historyData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for history taking', { 
        patientHn: patient.hn,
        recordType: 'history_taking'
      });
    } catch (error) {
      logger.error('Error creating patient document for history taking:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกประวัติ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ซักประวัติผู้ป่วย</h1>
              <p className="text-gray-600">ซักประวัติและบันทึกอาการของผู้ป่วย</p>
            </div>
          </div>
        </div>

      <div className="space-y-4 md:space-y-6">
        {/* Patient Search Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              ค้นหาผู้ป่วย
            </h2>
            <p className="text-gray-600">ค้นหาผู้ป่วยที่ผ่านการวัดสัญญาณชีพแล้วเพื่อซักประวัติ</p>
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 font-medium">ข้อมูลผู้ป่วย</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">HN:</span>
                  <span className="ml-2 font-bold text-blue-600 text-lg">{selectedPatient.hn}</span>
                </div>
                <div>
                  <span className="text-slate-600">ชื่อ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.thaiName}</span>
                </div>
                <div>
                  <span className="text-slate-600">อายุ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.birth_date ? calculateAge(selectedPatient.birth_date) : 'ไม่ระบุ'} ปี</span>
                </div>
                <div>
                  <span className="text-slate-600">เพศ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.gender === 'male' ? 'ชาย' : 'หญิง'}</span>
                </div>
              </div>

              {/* Patient Info Note */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium text-sm">ข้อมูลผู้ป่วย</span>
                </div>
                <div className="text-xs text-slate-600">
                  <p>กรุณาดำเนินการซักประวัติเพื่อเตรียมข้อมูลสำหรับแพทย์</p>
                  <p className="mt-1">หมายเหตุ: ข้อมูลสัญญาณชีพจะแสดงหลังจากการตรวจวัดแล้ว</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Medical History Form */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b bg-slate-50">
              <div className="flex overflow-x-auto">
                {navigationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{section.icon}</span>
                      <div className="text-left">
                        <div className="font-bold">{section.label}</div>
                        <div className="text-xs opacity-75">{section.title}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                
                {/* Chief Complaint */}
                {activeSection === "cc" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">💬</span>
                        Chief Complaint (อาการสำคัญที่มาพบแพทย์)
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          อาการหลักที่ผู้ป่วยมาพบแพทย์ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicalHistory.chiefComplaint}
                          onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.chiefComplaint ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="เช่น ปวดท้อง, ไข้, ไอ, ปวดหัด เป็นต้น (อธิบายให้ละเอียด)"
                        />
                        {errors.chiefComplaint && <p className="text-red-500 text-sm mt-1">{errors.chiefComplaint}</p>}
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">แนวทางการซักประวัติ Chief Complaint:</p>
                            <ul className="space-y-1 text-blue-700">
                              <li>• ใช้คำของผู้ป่วยเอง ไม่ใช่การวินิจฉัย</li>
                              <li>• ระบุระยะเวลาที่มีอาการ</li>
                              <li>• ถ้ามีหลายอาการ ให้เรียงตามลำดับความสำคัญ</li>
                              <li>• หลีกเลี่ยงการใช้คำทางการแพทย์</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History of Present Illness */}
                {activeSection === "hpi" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        History of Present Illness (ประวัติอาการปัจจุบัน)
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          รายละเอียดของอาการปัจจุบัน <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicalHistory.hpi}
                          onChange={(e) => handleInputChange("hpi", e.target.value)}
                          rows={8}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.hpi ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="อธิบายรายละเอียดของอาการ ใช้หลัก OPQRST หรือ SOCRATES..."
                        />
                        {errors.hpi && <p className="text-red-500 text-sm mt-1">{errors.hpi}</p>}
                      </div>

                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-2">OPQRST Framework สำหรับ HPI:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-amber-700">
                              <div><strong>O</strong>nset - เริ่มเมื่อไหร่, อย่างไร</div>
                              <div><strong>P</strong>rovocation - อะไรทำให้เพิ่ม/ลด</div>
                              <div><strong>Q</strong>uality - ลักษณะของอาการ</div>
                              <div><strong>R</strong>adiation - แพร่ไปที่ไหน</div>
                              <div><strong>S</strong>everity - ระดับความรุนแรง 1-10</div>
                              <div><strong>T</strong>ime - ระยะเวลา, ความถี่</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past Medical History */}
                {activeSection === "pmh" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🏥</span>
                        Past Medical History (ประวัติการรักษาในอดีต)
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            โรคประจำตัว / โรคเก่า
                          </label>
                          <textarea
                            value={medicalHistory.pmh.previousIllness}
                            onChange={(e) => handleInputChange("pmh.previousIllness", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เบาหวาน, ความดันสูง, โรคหัวใจ, ไต เป็นต้น"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ประวัติการผ่าตัด
                          </label>
                          <textarea
                            value={medicalHistory.pmh.surgicalHistory}
                            onChange={(e) => handleInputChange("pmh.surgicalHistory", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุการผ่าตัด ปี และสาเหตุ"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ประวัติการเข้าโรงพยาบาล
                          </label>
                          <textarea
                            value={medicalHistory.pmh.hospitalization}
                            onChange={(e) => handleInputChange("pmh.hospitalization", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เหตุผลในการเข้า รพ. และช่วงเวลา"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drug Allergy & Current Medications */}
                {activeSection === "drugs" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">💊</span>
                        Drug Allergy & Current Medications
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Drug Allergy */}
                        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                          <h4 className="font-semibold text-red-800 mb-3">แพ้ยา</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                มีประวัติแพ้ยาหรือไม่?
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="no"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "no"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">ไม่แพ้</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="yes"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "yes"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">แพ้</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="unknown"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "unknown"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">ไม่ทราบ</span>
                                </label>
                              </div>
                            </div>

                            {medicalHistory.drugAllergy.hasAllergy === "yes" && (
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  รายละเอียดการแพ้ยา
                                </label>
                                <textarea
                                  value={medicalHistory.drugAllergy.allergyDetails}
                                  onChange={(e) => handleInputChange("drugAllergy.allergyDetails", e.target.value)}
                                  rows={3}
                                  className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  placeholder="ระบุชื่อยาที่แพ้ และอาการที่เกิดขึ้น"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Current Medications */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ยาที่ใช้ประจำ / ยาที่กำลังทาน
                          </label>
                          <textarea
                            value={medicalHistory.currentMedications}
                            onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุชื่อยา ขนาด ความถี่ เช่น Amlodipine 5mg OD, Metformin 500mg BID"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Family History */}
                {activeSection === "family" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                        Family History (ประวัติครอบครัว)
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            โรคทางพันธุกรรมในครอบครัว
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { key: "diabetes", label: "เบาหวาน (Diabetes)" },
                              { key: "hypertension", label: "ความดันโลหิตสูง (Hypertension)" },
                              { key: "heartDisease", label: "โรคหัวใจ (Heart Disease)" },
                              { key: "cancer", label: "มะเร็ง (Cancer)" }
                            ].map((disease) => (
                              <label key={disease.key} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={medicalHistory.familyHistory[disease.key as keyof typeof medicalHistory.familyHistory] as boolean}
                                  onChange={(e) => handleInputChange(`familyHistory.${disease.key}`, e.target.checked)}
                                  className="mr-3"
                                />
                                <span className="text-sm">{disease.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            โรคอื่นๆ ในครอบครัว
                          </label>
                          <textarea
                            value={medicalHistory.familyHistory.other}
                            onChange={(e) => handleInputChange("familyHistory.other", e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="โรคอื่นๆ ที่สำคัญในครอบครัว"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social History */}
                {activeSection === "social" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🌍</span>
                        Social History (ประวัติสังคม)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Smoking */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การสูบบุหรี่
                          </label>
                          <select
                            value={medicalHistory.socialHistory.smoking}
                            onChange={(e) => handleInputChange("socialHistory.smoking", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="never">ไม่เคยสูบ</option>
                            <option value="former">เคยสูบ แต่เลิกแล้ว</option>
                            <option value="current">สูบอยู่ปัจจุบัน</option>
                          </select>
                        </div>

                        {/* Alcohol */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การดื่มเครื่องดื่มแอลกอฮอล์
                          </label>
                          <select
                            value={medicalHistory.socialHistory.alcohol}
                            onChange={(e) => handleInputChange("socialHistory.alcohol", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="never">ไม่เคยดื่ม</option>
                            <option value="occasional">ดื่มเป็นครั้งคราว</option>
                            <option value="regular">ดื่มเป็นประจำ</option>
                            <option value="former">เคยดื่ม แต่เลิกแล้ว</option>
                          </select>
                        </div>

                        {/* Occupation */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            อาชีพ
                          </label>
                          <input
                            type="text"
                            value={medicalHistory.socialHistory.occupation}
                            onChange={(e) => handleInputChange("socialHistory.occupation", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุอาชีพและลักษณะงาน"
                          />
                        </div>

                        {/* Exercise */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การออกกำลังกาย
                          </label>
                          <select
                            value={medicalHistory.socialHistory.exercise}
                            onChange={(e) => handleInputChange("socialHistory.exercise", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="none">ไม่ออกกำลังกาย</option>
                            <option value="light">เบา (1-2 ครั้ง/สัปดาห์)</option>
                            <option value="moderate">ปานกลาง (3-4 ครั้ง/สัปดาห์)</option>
                            <option value="vigorous">หนัก (5+ ครั้ง/สัปดาห์)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ข้อมูลสังคมอื่นๆ
                        </label>
                        <textarea
                          value={medicalHistory.socialHistory.other}
                          onChange={(e) => handleInputChange("socialHistory.other", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ข้อมูลเพิ่มเติม เช่น สภาพแวดล้อมในการทำงาน, ความเครียด, การเดินทาง"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pregnancy History (for women only) */}
                {activeSection === "pregnancy" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🤱</span>
                        Pregnancy History (ประวัติการตั้งครรภ์) - สำหรับผู้หญิงเท่านั้น
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Has been pregnant */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เคยตั้งครรภ์หรือไม่
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasBeenPregnant"
                                value="true"
                                checked={medicalHistory.pregnancyHistory?.hasBeenPregnant === true}
                                onChange={(e) => handleInputChange("pregnancyHistory.hasBeenPregnant", e.target.value === "true")}
                                className="mr-2"
                              />
                              เคย
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasBeenPregnant"
                                value="false"
                                checked={medicalHistory.pregnancyHistory?.hasBeenPregnant === false}
                                onChange={(e) => handleInputChange("pregnancyHistory.hasBeenPregnant", e.target.value === "true")}
                                className="mr-2"
                              />
                              ไม่เคย
                            </label>
                          </div>
                        </div>

                        {medicalHistory.pregnancyHistory?.hasBeenPregnant && (
                          <>
                            {/* Gestational Diabetes */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                เคยเป็นเบาหวานขณะตั้งครรภ์หรือไม่ <span className="text-red-500 text-xs">(สำคัญมาก!)</span>
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gestationalDiabetes"
                                    value="true"
                                    checked={medicalHistory.pregnancyHistory?.gestationalDiabetes === true}
                                    onChange={(e) => handleInputChange("pregnancyHistory.gestationalDiabetes", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  เคย
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gestationalDiabetes"
                                    value="false"
                                    checked={medicalHistory.pregnancyHistory?.gestationalDiabetes === false}
                                    onChange={(e) => handleInputChange("pregnancyHistory.gestationalDiabetes", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  ไม่เคย
                                </label>
                              </div>
                            </div>

                            {/* PCOS */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                เคยได้รับการวินิจฉัยว่าเป็น PCOS (Polycystic Ovary Syndrome) หรือไม่
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="polycysticOvarySyndrome"
                                    value="true"
                                    checked={medicalHistory.pregnancyHistory?.polycysticOvarySyndrome === true}
                                    onChange={(e) => handleInputChange("pregnancyHistory.polycysticOvarySyndrome", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  เคย
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="polycysticOvarySyndrome"
                                    value="false"
                                    checked={medicalHistory.pregnancyHistory?.polycysticOvarySyndrome === false}
                                    onChange={(e) => handleInputChange("pregnancyHistory.polycysticOvarySyndrome", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  ไม่เคย
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Number of pregnancies */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  จำนวนครั้งที่ตั้งครรภ์
                                </label>
                                <input
                                  type="number"
                                  value={medicalHistory.pregnancyHistory?.numberOfPregnancies}
                                  onChange={(e) => handleInputChange("pregnancyHistory.numberOfPregnancies", e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="จำนวนครั้ง"
                                  min="0"
                                />
                              </div>

                              {/* Largest baby weight */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  น้ำหนักลูกที่คลอดมากที่สุด (กิโลกรัม) <span className="text-xs text-gray-500">(&gt;4 กก. = เสี่ยง)</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={medicalHistory.pregnancyHistory?.largestBabyWeight}
                                  onChange={(e) => handleInputChange("pregnancyHistory.largestBabyWeight", e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="เช่น 3.2"
                                />
                              </div>
                            </div>

                            {/* Pregnancy complications */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                ภาวะแทรกซ้อนระหว่างตั้งครรภ์
                              </label>
                              <textarea
                                value={medicalHistory.pregnancyHistory?.pregnancyComplications}
                                onChange={(e) => handleInputChange("pregnancyHistory.pregnancyComplications", e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น ความดันสูง, เบาหวาน, คลื่นไส้อาเจียนรุนแรง"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-amber-600 text-lg mr-2">⚠️</span>
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">ความสำคัญของประวัติการตั้งครรภ์:</p>
                            <ul className="space-y-1 text-amber-700">
                              <li>• เบาหวานขณะตั้งครรภ์เพิ่มความเสี่ยงเบาหวาน Type 2 ในอนาคต</li>
                              <li>• PCOS เป็นปัจจัยเสี่ยงสำคัญต่อเบาหวาน</li>
                              <li>• ลูกน้ำหนักเกิน 4 กก. บ่งชี้ว่าแม่อาจมีน้ำตาลในเลือดสูง</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dietary History */}
                {activeSection === "dietary" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🍎</span>
                        Dietary History (ประวัติการรับประทานอาหาร)
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Daily sugar intake */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              การบริโภคน้ำตาล/ของหวานต่อวัน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.dailySugarIntake}
                              onChange={(e) => handleInputChange("dietaryHistory.dailySugarIntake", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="low">น้อย (1-2 ชิ้น/วัน)</option>
                              <option value="moderate">ปานกลาง (3-4 ชิ้น/วัน)</option>
                              <option value="high">มาก (5+ ชิ้น/วัน)</option>
                            </select>
                          </div>

                          {/* Processed food frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ความถี่การกินอาหารแปรรูป
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.processedFoodFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.processedFoodFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="rare">นาน ๆ ครั้ง</option>
                              <option value="sometimes">บางครั้ง (1-2 ครั้ง/สัปดาห์)</option>
                              <option value="often">บ่อย (3-4 ครั้ง/สัปดาห์)</option>
                              <option value="daily">ทุกวัน</option>
                            </select>
                          </div>

                          {/* Fruit & vegetable servings */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ผักและผลไม้ต่อวัน (จำนวนส่วน)
                            </label>
                            <input
                              type="number"
                              value={medicalHistory.dietaryHistory.fruitVegetableServings}
                              onChange={(e) => handleInputChange("dietaryHistory.fruitVegetableServings", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 5 (แนะนำ 5-9 ส่วน/วัน)"
                              min="0"
                            />
                          </div>

                          {/* Fast food frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ความถี่การกินอาหารจานด่วน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.fastFoodFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.fastFoodFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="never">ไม่เคย</option>
                              <option value="monthly">เดือนละครั้ง</option>
                              <option value="weekly">สัปดาห์ละครั้ง</option>
                              <option value="daily">ทุกวัน</option>
                            </select>
                          </div>

                          {/* Meal frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              จำนวนมื้ออาหารต่อวัน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.mealFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.mealFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="1">1 มื้อ</option>
                              <option value="2">2 มื้อ</option>
                              <option value="3">3 มื้อ</option>
                              <option value="4">4+ มื้อ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-green-600 text-lg mr-2">💡</span>
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">แนวทางการประเมินอาหาร:</p>
                            <ul className="space-y-1 text-green-700">
                              <li>• น้ำตาลสูง + อาหารแปรรูปบ่อย = เสี่ยงเบาหวาน</li>
                              <li>• ผักผลไม้น้อยกว่า 5 ส่วน/วัน = ขาดไฟเบอร์</li>
                              <li>• อาหารจานด่วนบ่อย = ไขมันและน้ำตาลสูง</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lifestyle Factors */}
                {activeSection === "lifestyle" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">💪</span>
                        Lifestyle Factors (ปัจจัยวิถีชีวิต)
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sleep duration */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ชั่วโมงการนอนต่อคืน
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={medicalHistory.lifestyleFactors.sleepDuration}
                              onChange={(e) => handleInputChange("lifestyleFactors.sleepDuration", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 7.5"
                              min="0"
                              max="24"
                            />
                          </div>

                          {/* Sleep quality */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              คุณภาพการนอน
                            </label>
                            <select
                              value={medicalHistory.lifestyleFactors.sleepQuality}
                              onChange={(e) => handleInputChange("lifestyleFactors.sleepQuality", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="poor">แย่ (นอนไม่หลับ/ตื่นบ่อย)</option>
                              <option value="fair">ปานกลาง</option>
                              <option value="good">ดี</option>
                              <option value="excellent">ดีมาก</option>
                            </select>
                          </div>

                          {/* Stress level */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ระดับความเครียด
                            </label>
                            <select
                              value={medicalHistory.lifestyleFactors.stressLevel}
                              onChange={(e) => handleInputChange("lifestyleFactors.stressLevel", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="low">น้อย</option>
                              <option value="moderate">ปานกลาง</option>
                              <option value="high">สูง</option>
                              <option value="severe">รุนแรง</option>
                            </select>
                          </div>

                          {/* Sedentary hours */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ชั่วโมงการนั่งต่อวัน (ทำงาน/ดู TV)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={medicalHistory.lifestyleFactors.sedentaryHours}
                              onChange={(e) => handleInputChange("lifestyleFactors.sedentaryHours", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 8"
                              min="0"
                              max="24"
                            />
                          </div>
                        </div>

                        {/* Physical activity details */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            รายละเอียดการออกกำลังกาย
                          </label>
                          <textarea
                            value={medicalHistory.lifestyleFactors.physicalActivityDetails}
                            onChange={(e) => handleInputChange("lifestyleFactors.physicalActivityDetails", e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เช่น เดิน 30 นาที 3 ครั้ง/สัปดาห์, เล่นโยคะ, ว่ายน้ำ, ยิม"
                          />
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-purple-600 text-lg mr-2">🎯</span>
                          <div className="text-sm text-purple-800">
                            <p className="font-medium mb-1">ผลกระทบต่อความเสี่ยงเบาหวาน:</p>
                            <ul className="space-y-1 text-purple-700">
                              <li>• นอนน้อยกว่า 6 ชม. หรือมากกว่า 9 ชม. = เพิ่มความเสี่ยง</li>
                              <li>• ความเครียดสูง = ฮอร์โมน cortisol สูง → น้ำตาลในเลือดขึ้น</li>
                              <li>• นั่งนาน &gt;8 ชม./วัน = ลดการใช้น้ำตาล</li>
                              <li>• ออกกำลังกายสม่ำเสมอ = ลดความเสี่ยงมากถึง 50%</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review of Systems */}
                {activeSection === "ros" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🔍</span>
                        Review of Systems (ตรวจสอบระบบต่างๆ)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: "general", label: "ทั่วไป (General)", placeholder: "น้ำหนักลด/เพิ่ม, เหนื่อยง่าย, ไข้" },
                          { key: "cardiovascular", label: "หัวใจและหลอดเลือด", placeholder: "เจ็บแน่นหน้าอก, หายใจลำบาก, บวม" },
                          { key: "respiratory", label: "ระบบหายใจ", placeholder: "ไอ, เสียงแหบ, หายใจลำบาก" },
                          { key: "gastroininal", label: "ระบบทางเดินอาหาร", placeholder: "คลื่นไส้, อาเจียน, ท้องเสีย, ท้องผูก" },
                          { key: "genitourinary", label: "ระบบปัสสาวะและสืบพันธุ์", placeholder: "ปัสสาวะขัด, เจ็บปวด, เลือด" },
                          { key: "neurological", label: "ระบบประสาท", placeholder: "ปวดหัว, เวียนหัว, ชา, อ่อนแรง" },
                          { key: "musculoskeletal", label: "กล้ามเนื้อและกระดูก", placeholder: "ปวดข้อ, บวม, แข็งเกร็ง" },
                          { key: "dermatological", label: "ผิวหนัง", placeholder: "ผื่น, คัน, เปลี่ยนสี" }
                        ].map((system) => (
                          <div key={system.key}>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {system.label}
                            </label>
                            <textarea
                              value={medicalHistory.reviewOfSystems[system.key as keyof typeof medicalHistory.reviewOfSystems]}
                              onChange={(e) => handleInputChange(`reviewOfSystems.${system.key}`, e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={system.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Information & Notes */}
                <div className="border-t pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ผู้บันทึก
                      </label>
                      <input
                        type="text"
                        value={medicalHistory.recordedBy}
                        onChange={(e) => handleInputChange("recordedBy", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ชื่อแพทย์ผู้บันทึก"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        เวลาที่บันทึก
                      </label>
                      <input
                        type="datetime-local"
                        value={medicalHistory.recordedTime}
                        onChange={(e) => handleInputChange("recordedTime", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <textarea
                      value={medicalHistory.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ข้อมูลเพิ่มเติมที่สำคัญ"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery("");
                      }}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 rounded-lg font-medium transition-all ${
                        isSubmitting
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
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
                          บันทึกประวัติผู้ป่วย
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">คำแนะนำการซักประวัติ:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• ใช้ Tab Navigation ด้านบนเพื่อเปลี่ยนหัวข้อการซักประวัติ</li>
                <li>• Chief Complaint และ HPI เป็นข้อมูลที่จำเป็น</li>
                <li>• ตรวจสอบประวัติแพ้ยาให้ละเอียดเพื่อความปลอดภัย</li>
                <li>• ข้อมูลจะถูกส่งต่อให้การตรวจร่างกายในขั้นตอนถัดไป</li>
              </ul>
            </div>
          </div>          </div>
        </div>
      </div>
    </div>
  );
}
