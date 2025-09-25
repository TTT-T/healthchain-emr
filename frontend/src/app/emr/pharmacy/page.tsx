"use client";
import { useState, useEffect } from "react";
import { Search, Pill, Plus, Trash2, CheckCircle, AlertCircle, User, Heart, Activity, FileText, Brain, Database, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { PharmacyService } from '@/services/pharmacyService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  instructions: string;
  dispensedQuantity: number;
  price: number;
}

export default function Pharmacy() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const calculateAgeFromFields = (patient: MedicalPatient): number => {
    logger.info("Calculating age for patient:", {
      birth_date: patient.birth_date,
      birthDate: patient.birthDate,
      birthYear: patient.birthYear,
      birthMonth: patient.birthMonth,
      birthDay: patient.birthDay
    });
    
    // Try to calculate age from separate birth fields first
    const birthYear = patient.birthYear;
    const birthMonth = patient.birthMonth;
    const birthDay = patient.birthDay;
    
    if (birthYear && birthMonth && birthDay) {
      const today = new Date();
      const adjustedBirthYear = birthYear > 2500 ? birthYear - 543 : birthYear;
      const birth = new Date(adjustedBirthYear, birthMonth - 1, birthDay);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      logger.info("Calculated age from separate fields:", {
        age,
        adjustedBirthYear,
        birthMonth,
        birthDay
      });
      
      return Math.max(0, age);
    }
    
    // Fallback to birth_date or birthDate
    if (patient.birth_date || patient.birthDate) {
      const birthDate = patient.birth_date || patient.birthDate;
      const age = calculateAge(birthDate);
      logger.info("Calculated age from birth_date:", { age, birth_date: birthDate });
      return Math.max(0, age);
    }
    
    // Try to parse birth_date from DD/MM/YYYY format
    if (patient.birthDate) {
      try {
        const parts = patient.birthDate.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const today = new Date();
            const adjustedYear = year > 2500 ? year - 543 : year;
            const birth = new Date(adjustedYear, month - 1, day);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            
            logger.info("Calculated age from birthDate DD/MM/YYYY:", {
              age,
              adjustedYear,
              month,
              day
            });
            
            return Math.max(0, age);
          }
        }
      } catch (error) {
        logger.error("Error parsing birthDate:", error);
      }
    }
    
    logger.info("No birth data available, returning 0");
    return 0;
  };

  // Update dispensedBy when user changes
  useEffect(() => {
    if (user) {
      const pharmacistName = user.thaiName || `${user.firstName} ${user.lastName}` || "เภสัชกร";
      setPharmacyData(prev => ({
        ...prev,
        dispensedBy: pharmacistName
      }));
    }
  }, [user]);

  const [pharmacyData, setPharmacyData] = useState({
    medications: [] as Medication[],
    totalAmount: 0,
    paymentMethod: 'cash',
    notes: '',
    dispensedTime: new Date().toISOString().slice(0, 16),
    dispensedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เภสัชกร",
    // AI Research Fields for Pharmacy
    aiResearchData: {
      drugInteractions: '', // ปฏิกิริยาระหว่างยา
      allergyWarnings: '', // คำเตือนการแพ้
      dosageAdjustments: '', // การปรับขนาดยา
      contraindications: '', // ข้อห้ามใช้
      sideEffects: '', // ผลข้างเคียงที่คาดหวัง
      monitoringRequirements: '', // ความต้องการติดตาม
      patientCompliance: '', // การปฏิบัติตามคำแนะนำ
      effectiveness: '', // ประสิทธิภาพของยา
      costEffectiveness: '', // ความคุ้มค่า
      alternativeMedications: '', // ยาทางเลือก
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
        const patient = response.data[0];
        logger.info("Patient found:", {
          id: patient.id,
          hospital_number: patient.hospitalNumber,
          thai_name: patient.thaiName,
          birth_date: patient.birth_date,
          birth_year: patient.birthYear,
          birth_month: patient.birthMonth,
          birth_day: patient.birthDay,
          gender: patient.gender
        });
        setSelectedPatient(patient);
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

  const addMedication = () => {
    const newMedication = {
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      unit: 'tablet',
      instructions: '',
      dispensedQuantity: 1,
      price: 0
    };
    
    setPharmacyData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  };

  const removeMedication = (index: number) => {
    setPharmacyData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
      totalAmount: PharmacyService.calculateTotalAmount(prev.medications.filter((_, i) => i !== index))
    }));
  };

  const updateMedication = (index: number, field: string, value: any) => {
    setPharmacyData(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications[index] = { ...updatedMedications[index], [field]: value };
      
      return {
        ...prev,
        medications: updatedMedications,
        totalAmount: PharmacyService.calculateTotalAmount(updatedMedications)
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Validate data
    const validation = PharmacyService.validatePharmacyData({
      ...pharmacyData,
      dispensedBy: user?.id || 'system'
    });
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      logger.info(' user data:', {
        userId: user?.id,
        userFirstName: user?.firstName,
        userLastName: user?.lastName,
        userThaiName: user?.thaiName,
        selectedPatientId: selectedPatient.id
      });
      
      const dispensedByValue = user?.id || 'system';
      logger.info(' dispensedBy value:', { dispensedByValue });
      
      const formattedData = PharmacyService.formatPharmacyDataForAPI(
        pharmacyData,
        selectedPatient.id,
        dispensedByValue
      );
      
      logger.info(' formatted data:', formattedData);
      
      const response = await PharmacyService.createPharmacyDispensing(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกการจ่ายยาสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reset form
        setTimeout(() => {
          setSelectedPatient(null);
          setSearchQuery("");
          setPharmacyData({
            medications: [],
            totalAmount: 0,
            paymentMethod: 'cash',
            notes: '',
            dispensedTime: new Date().toISOString().slice(0, 16),
            dispensedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เภสัชกร",
            // Reset AI Research Data
            aiResearchData: {
              drugInteractions: '',
              allergyWarnings: '',
              dosageAdjustments: '',
              contraindications: '',
              sideEffects: '',
              monitoringRequirements: '',
              patientCompliance: '',
              effectiveness: '',
              costEffectiveness: '',
              alternativeMedications: '',
              researchNotes: ''
            }
          });
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกการจ่ายยา");
      }
    } catch (error) {
      logger.error("Error saving pharmacy dispensing:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกการจ่ายยา");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, dispensingRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName && patient.thaiLastName 
          ? `${patient.thaiName} ${patient.thaiLastName}`
          : patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'pharmacy_dispensing',
        recordId: dispensingRecord.id,
        chiefComplaint: `จ่ายยา ${dispensingRecord.medications.length} รายการ`,
        recordedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร',
        recordedTime: dispensingRecord.dispensedTime,
        message: `มีการจ่ายยาใหม่สำหรับคุณ ${patient.thaiName && patient.thaiLastName ? `${patient.thaiName} ${patient.thaiLastName}` : patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร'}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for pharmacy dispensing', {
        patientHn: notificationData.patientHn,
        recordId: dispensingRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for pharmacy dispensing:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบจ่ายยา</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, pharmacyData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'prescription',
        pharmacyData,
        {
          patientHn: patient.hospitalNumber || '',
          patientNationalId: patient.national_id || '',
          patientName: patient.thaiName && patient.thaiLastName 
            ? `${patient.thaiName} ${patient.thaiLastName}`
            : patient.thaiName || ''
        },
        user?.id || 'system',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร'
      );
      
      logger.info('Patient document created successfully for pharmacy', { 
        patientHn: patient.hospitalNumber,
        recordType: 'prescription'
      });
    } catch (error) {
      logger.error('Error creating patient document for pharmacy:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกการจ่ายยา
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Pill className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จ่ายยา</h1>
              <p className="text-gray-600">บันทึกการจ่ายยาและจัดการรายการยา</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType("hn")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "hn"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ค้นหาด้วย HN
              </button>
              <button
                onClick={() => setSearchType("queue")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "queue"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ค้นหาด้วยคิว
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN (เช่น HN250001)" : "กรอกหมายเลขคิว (เช่น V2025090001)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Comprehensive Patient Information for Pharmacy */}
          {selectedPatient && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">ข้อมูลผู้ป่วยสำหรับการจ่ายยา</h3>
                  <p className="text-green-600">ข้อมูลครบถ้วนเพื่อความปลอดภัยในการจ่ายยา</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">HN:</span>
                      <span className="font-bold text-green-600">{selectedPatient.hn || selectedPatient.hospitalNumber}</span>
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
                        {(() => {
                          const age = calculateAgeFromFields(selectedPatient);
                          if (age > 0) {
                            return `${age} ปี`;
                          } else if (selectedPatient.birth_date || selectedPatient.birthDate || selectedPatient.birthYear) {
                            return 'ไม่สามารถคำนวณได้';
                          } else {
                            return 'ไม่ระบุ';
                          }
                        })()}
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

                {/* Critical Medical Information */}
                <div className="bg-white rounded-lg p-4 border border-red-100">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    ข้อมูลสำคัญสำหรับเภสัชกร
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

                {/* Current Medications & Vital Signs */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    ข้อมูลปัจจุบัน
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
                      <span className="font-medium text-green-600">พร้อมจ่ายยา</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drug Interaction Warnings */}
              {(selectedPatient.drugAllergies || selectedPatient.currentMedications) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">⚠️ คำเตือนสำหรับเภสัชกร:</p>
                      <ul className="space-y-1 text-red-700">
                        {selectedPatient.drugAllergies && (
                          <li>• <strong>แพ้ยา:</strong> {selectedPatient.drugAllergies}</li>
                        )}
                        {selectedPatient.currentMedications && (
                          <li>• <strong>ยาที่ใช้อยู่:</strong> {selectedPatient.currentMedications}</li>
                        )}
                        <li>• ตรวจสอบปฏิกิริยาระหว่างยาก่อนจ่ายยา</li>
                        <li>• แจ้งผู้ป่วยเกี่ยวกับผลข้างเคียงที่อาจเกิดขึ้น</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions for Pharmacist */}
              <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">คำแนะนำสำหรับเภสัชกร:</p>
                    <ul className="space-y-1 text-green-700">
                      <li>• ตรวจสอบประวัติการแพ้ยาและอาหารก่อนจ่ายยา</li>
                      <li>• ตรวจสอบปฏิกิริยาระหว่างยากับยาที่ใช้อยู่</li>
                      <li>• อธิบายวิธีใช้ยาและข้อควรระวังให้ผู้ป่วย</li>
                      <li>• บันทึกข้อมูลการจ่ายยาให้ครบถ้วนเพื่อการวิจัย</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medications */}
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">รายการยา</h3>
                <button
                  onClick={addMedication}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มยา
                </button>
              </div>

              {pharmacyData.medications.map((medication, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">ยา {index + 1}</h4>
                    <button
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อยา *</label>
                      <input
                        type="text"
                        value={medication.medicationName}
                        onChange={(e) => updateMedication(index, 'medicationName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="กรอกชื่อยา"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดยา *</label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น 500mg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่ *</label>
                      <input
                        type="text"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น วันละ 3 ครั้ง"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา *</label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น 7 วัน"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน *</label>
                      <input
                        type="number"
                        value={medication.quantity}
                        onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                      <select
                        value={medication.unit}
                        onChange={(e) => updateMedication(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="tablet">เม็ด</option>
                        <option value="capsule">แคปซูล</option>
                        <option value="ml">มิลลิลิตร</option>
                        <option value="mg">มิลลิกรัม</option>
                        <option value="g">กรัม</option>
                        <option value="piece">ชิ้น</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย (บาท) *</label>
                      <input
                        type="number"
                        value={medication.price || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateMedication(index, 'price', 0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              updateMedication(index, 'price', numValue);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่จ่าย</label>
                      <input
                        type="number"
                        value={medication.dispensedQuantity}
                        onChange={(e) => updateMedication(index, 'dispensedQuantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีใช้</label>
                    <textarea
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                      placeholder="กรอกวิธีใช้ยา"
                    />
                  </div>
                </div>
              ))}

              {/* Payment Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">ข้อมูลการชำระเงิน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ยอดรวม</label>
                    <input
                      type="number"
                      value={pharmacyData.totalAmount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการชำระเงิน</label>
                    <select
                      value={pharmacyData.paymentMethod}
                      onChange={(e) => setPharmacyData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="card">บัตรเครดิต</option>
                      <option value="insurance">ประกันสุขภาพ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                <textarea
                  value={pharmacyData.notes}
                  onChange={(e) => setPharmacyData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>

              {/* AI Research Data Section for Pharmacy */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800">ข้อมูลสำหรับ AI และการวิจัยเภสัชกรรม</h3>
                    <p className="text-purple-600">ข้อมูลเพิ่มเติมเพื่อการพัฒนาระบบ AI และการวิจัยเภสัชกรรม</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Drug Safety & Interactions */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">ความปลอดภัยและปฏิกิริยาระหว่างยา</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ปฏิกิริยาระหว่างยา
                        </label>
                        <textarea
                          value={pharmacyData.aiResearchData.drugInteractions}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, drugInteractions: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ยา A กับยา B อาจทำให้เกิดผลข้างเคียง"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          คำเตือนการแพ้
                        </label>
                        <textarea
                          value={pharmacyData.aiResearchData.allergyWarnings}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, allergyWarnings: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ระวังการแพ้ในผู้ป่วยที่มีประวัติแพ้ยา"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ข้อห้ามใช้
                        </label>
                        <textarea
                          value={pharmacyData.aiResearchData.contraindications}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, contraindications: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ห้ามใช้ในผู้ป่วยโรคไต, ห้ามใช้ในสตรีมีครรภ์"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medication Effectiveness & Monitoring */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">ประสิทธิภาพและการติดตาม</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ประสิทธิภาพของยา
                        </label>
                        <select
                          value={pharmacyData.aiResearchData.effectiveness}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, effectiveness: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกประสิทธิภาพ</option>
                          <option value="excellent">ดีมาก</option>
                          <option value="good">ดี</option>
                          <option value="fair">ปานกลาง</option>
                          <option value="poor">ไม่ดี</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความต้องการติดตาม
                        </label>
                        <textarea
                          value={pharmacyData.aiResearchData.monitoringRequirements}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, monitoringRequirements: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ตรวจเลือดทุก 3 เดือน, วัดความดันทุกสัปดาห์"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ผลข้างเคียงที่คาดหวัง
                        </label>
                        <textarea
                          value={pharmacyData.aiResearchData.sideEffects}
                          onChange={(e) => setPharmacyData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, sideEffects: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น คลื่นไส้, ง่วงนอน, ปวดหัว"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional AI Research Fields */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      การปรับขนาดยา
                    </label>
                    <textarea
                      value={pharmacyData.aiResearchData.dosageAdjustments}
                      onChange={(e) => setPharmacyData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, dosageAdjustments: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น ลดขนาดยาในผู้ป่วยสูงอายุ, เพิ่มขนาดยาในผู้ป่วยอ้วน"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ยาทางเลือก
                    </label>
                    <textarea
                      value={pharmacyData.aiResearchData.alternativeMedications}
                      onChange={(e) => setPharmacyData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, alternativeMedications: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น ยา A, ยา B, ยา C"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    หมายเหตุสำหรับการวิจัยเภสัชกรรม
                  </label>
                  <textarea
                    value={pharmacyData.aiResearchData.researchNotes}
                    onChange={(e) => setPharmacyData(prev => ({
                      ...prev,
                      aiResearchData: { ...prev.aiResearchData, researchNotes: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="ข้อมูลเพิ่มเติมที่สำคัญสำหรับการวิจัยเภสัชกรรมและพัฒนาระบบ AI"
                  />
                </div>

                <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">ประโยชน์ของข้อมูล AI Research สำหรับเภสัชกรรม:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• ช่วยพัฒนาระบบ AI ในการตรวจสอบปฏิกิริยาระหว่างยา</li>
                        <li>• ใช้ในการวิจัยเพื่อหาประสิทธิภาพและความปลอดภัยของยา</li>
                        <li>• ปรับปรุงการจ่ายยาและการติดตามผู้ป่วย</li>
                        <li>• สร้างฐานข้อมูลสำหรับการวิเคราะห์แนวโน้มการใช้ยา</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || pharmacyData.medications.length === 0}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการจ่ายยา"}
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
                <p className="text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}