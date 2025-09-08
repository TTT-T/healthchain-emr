"use client";
import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { VisitService } from '@/services/visitService';
import { PDFService } from '@/services/pdfService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { addTokenExpiryTestButton } from '@/utils/tokenExpiryTest';

interface Patient {
  hn: string;
  national_id: string;
  thai_name: string;
  english_name: string;
  gender: string;
  birth_date: string;
  phone: string;
  blood_group: string;
  rh_factor: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  currentQueue: number;
  estimatedWaitTime: number;
  isAvailable: boolean;
}

interface CheckInData {
  patientHn: string;
  patientNationalId: string;
  treatmentType: string;
  assignedDoctor: string;
  visitTime: string;
  symptoms: string;
  notes: string;
}

export default function CheckIn() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "nationalId">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedQueueNumber, setGeneratedQueueNumber] = useState<string | null>(null);
  
  const [checkInData, setCheckInData] = useState<CheckInData>({
    patientHn: "",
    patientNationalId: "",
    treatmentType: "",
    assignedDoctor: "",
    visitTime: new Date().toISOString().slice(0, 16),
    symptoms: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Partial<CheckInData>>({});

  // Real doctors data - will be loaded from API
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const treatmentTypes = [
    { value: "opd", label: "OPD - ตรวจรักษาทั่วไป", icon: "🏥", color: "blue" },
    { value: "health_check", label: "ตรวจสุขภาพ", icon: "🩺", color: "green" },
    { value: "vaccination", label: "ฉีดวัคซีน", icon: "💉", color: "purple" },
    { value: "emergency", label: "ฉุกเฉิน", icon: "🚨", color: "red" },
    { value: "followup", label: "นัดติดตามผล", icon: "📋", color: "orange" }
  ];

  // Load real doctors data
  const loadDoctors = async () => {
    try {
      // For now, use sample data to avoid authentication issues
      // TODO: Implement proper authentication flow
      const sampleDoctors = [
        {
          id: 'doc-001',
          name: 'นพ. สมชาย ใจดี',
          department: 'อายุรกรรม',
          specialization: 'โรคหัวใจ',
          isAvailable: true,
          currentQueue: 3,
          estimatedWaitTime: 15
        },
        {
          id: 'doc-002', 
          name: 'นพ. สมหญิง รักสุขภาพ',
          department: 'กุมารเวชกรรม',
          specialization: 'โรคติดเชื้อ',
          isAvailable: true,
          currentQueue: 1,
          estimatedWaitTime: 5
        },
        {
          id: 'doc-003',
          name: 'นพ. สมศักดิ์ ใจงาม',
          department: 'ศัลยกรรม',
          specialization: 'ศัลยกรรมทั่วไป',
          isAvailable: true,
          currentQueue: 2,
          estimatedWaitTime: 10
        },
        {
          id: 'doc-004',
          name: 'นพ. สมพร รักงาน',
          department: 'สูติ-นรีเวช',
          specialization: 'สูติกรรม',
          isAvailable: true,
          currentQueue: 0,
          estimatedWaitTime: 0
        }
      ];
      
      setDoctors(sampleDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Set sample data as fallback
      const sampleDoctors = [
        {
          id: 'doc-001',
          name: 'นพ. สมชาย ใจดี',
          department: 'อายุรกรรม',
          specialization: 'โรคหัวใจ',
          isAvailable: true,
          currentQueue: 3,
          estimatedWaitTime: 15
        },
        {
          id: 'doc-002', 
          name: 'นพ. สมหญิง รักสุขภาพ',
          department: 'กุมารเวชกรรม',
          specialization: 'โรคติดเชื้อ',
          isAvailable: true,
          currentQueue: 1,
          estimatedWaitTime: 5
        }
      ];
      setDoctors(sampleDoctors);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDoctors();
    }
    
    // Add test button for development
    addTokenExpiryTestButton();
  }, [isAuthenticated]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    if (searchType === "nationalId" && !/^\d{13}$/.test(searchQuery)) {
      setError("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
      return;
    }

    if (searchType === "hn" && searchQuery.length < 3) {
      setError("หมายเลข HN ต้องมีอย่างน้อย 3 หลัก");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSelectedPatient(null);
    
    try {
      // Search by name if nationalId, otherwise by hn
      const searchBy = searchType === "nationalId" ? "name" : "hn";
      const response = await PatientService.searchPatients(searchQuery, searchBy);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        // Find exact match
        const exactMatch = response.data.find(p => {
          if (searchType === "hn") {
            return (p as any).hn === searchQuery || (p as any).hospital_number === searchQuery;
          } else {
            return (p as any).national_id === searchQuery;
          }
        });
        
        if (exactMatch) {
          setSelectedPatient(exactMatch);
          setCheckInData(prev => ({
            ...prev,
            patientHn: exactMatch.hn || exactMatch.hospital_number || '',
            patientNationalId: exactMatch.national_id || ''
          }));
          setSuccess("พบข้อมูลผู้ป่วยแล้ว");
        } else {
          setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูลหรือลงทะเบียนใหม่");
        }
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูลหรือลงทะเบียนใหม่");
      }
      
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: keyof CheckInData, value: string) => {
    setCheckInData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckInData> = {};

    if (!selectedPatient) newErrors.patientHn = "กรุณาเลือกผู้ป่วย";
    if (!checkInData.treatmentType) newErrors.treatmentType = "กรุณาเลือกประเภทการรักษา";
    if (!checkInData.assignedDoctor) newErrors.assignedDoctor = "กรุณาเลือกแพทย์ผู้ตรวจ";
    if (!checkInData.visitTime) newErrors.visitTime = "กรุณาเลือกเวลาเริ่ม visit";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create visit record using VisitService
      const visitData = {
        patientId: selectedPatient!.id,
        visitType: checkInData.treatmentType as any,
        chiefComplaint: checkInData.symptoms || 'ไม่ระบุอาการ',
        presentIllness: checkInData.notes,
        priority: 'normal' as const,
        attendingDoctorId: checkInData.assignedDoctor,
      };
      
      const response = await VisitService.createVisit(visitData);
      
      if (response.statusCode === 200) {
        // Generate queue number (this would come from the API in real implementation)
        const queueNumber = `Q${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
        const selectedDoc = doctors.find(d => d.id === checkInData.assignedDoctor);
        
        // Send notification to patient
        await sendPatientNotification(selectedPatient!, queueNumber, selectedDoc!, checkInData);
        
        setGeneratedQueueNumber(queueNumber);
        setSuccess(`เช็คอินสำเร็จ!\n\nหมายเลขคิว: ${queueNumber}\nแพทย์: ${selectedDoc?.name}\nคิวที่รอ: ${selectedDoc?.currentQueue} คิว\nเวลารอโดยประมาณ: ${selectedDoc?.estimatedWaitTime} นาที\n\n✅ ระบบได้ส่งการแจ้งเตือนให้ผู้ป่วยแล้ว\n📄 PDF รายงานถูกเก็บในระบบแล้ว`);
        
        // Don't reset form immediately - let user generate PDF first
        // setSelectedPatient(null);
        // setSearchQuery("");
        // setCheckInData({
        //   patientHn: "",
        //   patientNationalId: "",
        //   treatmentType: "",
        //   assignedDoctor: "",
        //   visitTime: new Date().toISOString().slice(0, 16),
        //   symptoms: "",
        //   notes: ""
        // });
      } else {
        setError("เกิดข้อผิดพลาดในการสร้างข้อมูล visit");
      }
      
    } catch (error) {
      logger.error("Error creating visit:", error);
      setError("เกิดข้อผิดพลาดในการเช็คอิน กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
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

  const getAvailableDoctors = () => {
    // Return all doctors for now, can add filtering logic later
    return doctors;
  };

  const handleGeneratePDF = async () => {
    if (!selectedPatient || !user || !generatedQueueNumber) {
      setError("ไม่สามารถสร้าง PDF ได้ ข้อมูลไม่ครบถ้วน");
      return;
    }

    try {
      const selectedDoc = doctors.find(d => d.id === checkInData.assignedDoctor);
      if (!selectedDoc) {
        setError("ไม่พบข้อมูลแพทย์ที่เลือก");
        return;
      }

      await PDFService.generateCheckInReport(
        selectedPatient,
        checkInData,
        selectedDoc,
        user,
        generatedQueueNumber
      );
      
      setSuccess("สร้าง PDF รายงานสำเร็จแล้ว");
    } catch (error) {
      logger.error("Error generating PDF:", error);
      setError("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  const handleResetForm = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    setGeneratedQueueNumber(null);
    setCheckInData({
      patientHn: "",
      patientNationalId: "",
      treatmentType: "",
      assignedDoctor: "",
      visitTime: new Date().toISOString().slice(0, 16),
      symptoms: "",
      notes: ""
    });
    setError(null);
    setSuccess(null);
  };

  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วย
   */
  const sendPatientNotification = async (
    patient: MedicalPatient, 
    queueNumber: string, 
    doctor: Doctor, 
    checkInData: CheckInData
  ) => {
    try {
      // สร้างข้อมูลการแจ้งเตือน
      const notificationData = {
        patientHn: patient.hn || patient.hospital_number || '',
        patientNationalId: patient.national_id || '',
        patientName: patient.thai_name || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        queueNumber,
        doctorName: doctor.name,
        department: doctor.department,
        visitTime: checkInData.visitTime,
        treatmentType: getTreatmentTypeLabel(checkInData.treatmentType),
        estimatedWaitTime: doctor.estimatedWaitTime,
        currentQueue: doctor.currentQueue,
        symptoms: checkInData.symptoms || 'ไม่ระบุ',
        notes: checkInData.notes || '',
        createdBy: user?.id || '',
        createdByName: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      };

      // ส่งการแจ้งเตือนผ่าน NotificationService
      await NotificationService.notifyPatientAppointment(notificationData);
      
      logger.info('Patient notification sent successfully', { 
        patientHn: notificationData.patientHn, 
        queueNumber 
      });
    } catch (error) {
      logger.error('Failed to send patient notification:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างคิว
    }
  };

  /**
   * แปลงประเภทการรักษาเป็นภาษาไทย
   */
  const getTreatmentTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'opd': 'OPD - ตรวจรักษาทั่วไป',
      'health_check': 'ตรวจสุขภาพ',
      'vaccination': 'ฉีดวัคซีน',
      'emergency': 'ฉุกเฉิน',
      'followup': 'นัดติดตามผล'
    };
    return types[type] || type;
  };

  // const getTreatmentTypeConfig = (type: string) => {
  //   return treatmentTypes.find(t => t.value === type) || treatmentTypes[0];
  // };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">เช็คอิน / สร้างคิว</h1>
              <p className="text-gray-600">เช็คอินผู้ป่วยและสร้างคิวรอรับการรักษา</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 whitespace-pre-line">{success}</span>
            </div>
          </div>
        )}

      <div className="space-y-4 md:space-y-6">
        {/* Patient Search Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              ค้นหาผู้ป่วย
            </h2>
            <p className="text-gray-600">ค้นหาด้วยหมายเลข HN หรือเลขบัตรประชาชน</p>
          </div>

          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "nationalId")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">หมายเลข HN</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="nationalId"
                  checked={searchType === "nationalId"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "nationalId")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">เลขบัตรประชาชน</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(searchType === "nationalId" ? e.target.value.replace(/\D/g, '') : e.target.value)}
                  maxLength={searchType === "nationalId" ? 13 : undefined}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={searchType === "hn" ? "HN2025001" : "1234567890123"}
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSearching || !searchQuery.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
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
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">พบข้อมูลผู้ป่วย</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">HN:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.hn}</span>
                </div>
                <div>
                  <span className="text-slate-600">ชื่อ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.thai_name}</span>
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
            </div>
          )}
        </div>

        {/* Check-in Form */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                สร้างคิว / เริ่ม Visit
              </h2>
              <p className="text-slate-600">กรุณากรอกข้อมูลการเข้ารับบริการ</p>
              
              {/* Current User Info */}
              {user && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        ผู้สร้างคิว: {user.thaiName || `${user.firstName} ${user.lastName}`}
                      </p>
                      <p className="text-xs text-blue-600">
                        {user.role === 'doctor' ? 'แพทย์' : 
                         user.role === 'nurse' ? 'พยาบาล' : 
                         user.role === 'staff' ? 'เจ้าหน้าที่' : 
                         user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'} 
                        {user.departmentId && ` - ${user.departmentId}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
              {/* Treatment Type Selection */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">ประเภทการรักษา</h3>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {treatmentTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        checkInData.treatmentType === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        checked={checkInData.treatmentType === type.value}
                        onChange={(e) => handleInputChange("treatmentType", e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center w-full">
                        <span className="text-2xl mr-3">{type.icon}</span>
                        <div>
                          <p className="font-medium text-slate-800">{type.label}</p>
                        </div>
                      </div>
                      {checkInData.treatmentType === type.value && (
                        <div className="absolute top-2 right-2">
                          <svg className={`w-5 h-5 text-${type.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {errors.treatmentType && <p className="text-red-500 text-sm mt-2">{errors.treatmentType}</p>}
              </div>

              {/* Doctor Assignment */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">แพทย์ผู้ตรวจ</h3>
                  <span className="text-red-500 ml-1">*</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {getAvailableDoctors().length > 0 ? (
                    getAvailableDoctors().map((doctor) => (
                    <label
                      key={doctor.id}
                      className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        checkInData.assignedDoctor === doctor.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={doctor.id}
                        checked={checkInData.assignedDoctor === doctor.id}
                        onChange={(e) => handleInputChange("assignedDoctor", e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start w-full">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-purple-600 font-semibold">👨‍⚕️</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{doctor.name}</p>
                          <p className="text-sm text-slate-600">{doctor.department} - {doctor.specialization}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              คิวรอ: {doctor.currentQueue}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              รอ: ~{doctor.estimatedWaitTime} นาที
                            </span>
                          </div>
                        </div>
                      </div>
                      {checkInData.assignedDoctor === doctor.id && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                    ))
                  ) : (
                    <div className="col-span-full p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">ไม่มีแพทย์ให้เลือก</p>
                        <p className="text-sm text-gray-500">กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลแพทย์</p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.assignedDoctor && <p className="text-red-500 text-sm mt-2">{errors.assignedDoctor}</p>}
              </div>

              {/* Visit Details */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-semibold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">รายละเอียดการเข้ารับบริการ</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      เวลาเริ่ม Visit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={checkInData.visitTime}
                      onChange={(e) => handleInputChange("visitTime", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.visitTime ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.visitTime && <p className="text-red-500 text-sm mt-1">{errors.visitTime}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      อาการเบื้องต้น
                    </label>
                    <input
                      type="text"
                      value={checkInData.symptoms}
                      onChange={(e) => handleInputChange("symptoms", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="ระบุอาการเบื้องต้น (ถ้ามี)"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={checkInData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-8">
                <div className="flex justify-between items-center">
                  {/* Action Buttons - only show after successful check-in */}
                  {generatedQueueNumber && (
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleGeneratePDF}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        สร้าง PDF รายงาน
                      </button>
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        เริ่มใหม่
                      </button>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      isSubmitting
                        ? 'bg-green-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        กำลังสร้างคิว...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        สร้างคิว
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">ขั้นตอนการเช็คอิน:</p>
              <ul className="space-y-1 text-green-700">
                <li>• ค้นหาผู้ป่วยด้วย HN หรือเลขบัตรประชาชน</li>
                <li>• เลือกประเภทการรักษาและแพทย์ผู้ตรวจ</li>
                <li>• ระบุเวลาและรายละเอียดการเข้ารับบริการ</li>
                <li>• หมายเลขคิวจะถูกสร้างอัตโนมัติหลังเช็คอินสำเร็จ</li>
              </ul>
            </div>
          </div>          </div>
        </div>
      </div>
    </div>
  );
}
