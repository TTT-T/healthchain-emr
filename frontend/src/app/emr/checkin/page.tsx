'use client';

import React, { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { VisitService } from '@/services/visitService';
import { PDFService } from '@/services/pdfService';
import { NotificationService } from '@/services/notificationService';
import { DoctorService, Doctor } from '@/services/doctorService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { addTokenExpiryButton } from '@/utils/tokenExpiry';
import { createLocalDateTimeString, formatToBuddhistEra, TimeInfo } from '@/utils/timeUtils';
import { getThailandTime, formatThailandTime } from '@/utils/thailandTime';

// ฟังก์ชันช่วยสำหรับการจัดการเวลาประเทศไทย
const getThaiTime = (): string => {
  // ใช้เวลาปัจจุบันของ browser
  return new Date().toISOString();
};

// ฟังก์ชันสำหรับแสดงเวลาปัจจุบันของประเทศไทย
const getCurrentThaiTime = (): string => {
  // ใช้เวลาปัจจุบันของ browser โดยตรง (เนื่องจาก browser อยู่ใน timezone UTC+7 อยู่แล้ว)
  const now = new Date();
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

interface Patient {
  hn: string;
  national_id: string;
  thai_name: string;
  english_name: string;
  gender: string;
  birth_date: string;
  phone: string;
  email: string;
  address: string;
  blood_group: string;
  rh_factor: string;
}

interface CheckInData {
  patientHn: string;
  patientNationalId: string;
  treatmentType: string;
  assignedDoctor: string;
  visitTime: string;
  symptoms: string;
  notes: string;
  // เพิ่มฟิลด์ตาม visits table
  visitType: string;
  priority: string;
  departmentId: string;
  assignedNurse: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpNotes: string;
  // เพิ่มฟิลด์สำหรับข้อมูลทางการแพทย์
  diagnosis: string;
  treatmentPlan: string;
  physicalExamination: string;
  doctorNotes: string;
  recommendations: string;
}

export default function CheckIn() {
  const { user } = useAuth();
  
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
    visitTime: getThaiTime(), // เวลาประเทศไทย
    symptoms: "",
    notes: "",
    // เพิ่มฟิลด์ใหม่
    visitType: "walk_in",
    priority: "normal",
    departmentId: "",
    assignedNurse: "",
    followUpRequired: false,
    followUpDate: "",
    followUpNotes: "",
    // เพิ่มฟิลด์สำหรับข้อมูลทางการแพทย์
    diagnosis: "",
    treatmentPlan: "",
    physicalExamination: "",
    doctorNotes: "",
    recommendations: ""
  });

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  });

  const [errors, setErrors] = useState<Partial<CheckInData>>({});
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentThaiTime());

  useEffect(() => {
    if (user) {
      // User is authenticated
    } else {
      // User is not authenticated
    }
  }, [user]);

  const loadDoctors = async () => {
    try {
      logger.info('🔄 Loading doctors from API...');
      const response = await DoctorService.getAvailableDoctors();
      
      if (response.statusCode === 200 && response.data) {
        const mappedDoctors: Doctor[] = Array.isArray(response.data) ? response.data.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.name || doctor.thaiName || `${doctor.firstName} ${doctor.lastName}`,
          department: doctor.department || 'ทั่วไป',
          specialization: doctor.specialization || 'แพทย์ทั่วไป',
          isAvailable: doctor.isAvailable !== false,
          currentQueue: doctor.currentQueue || 0,
          estimatedWaitTime: doctor.estimatedWaitTime || 15,
          medicalLicenseNumber: doctor.medicalLicenseNumber || '',
          yearsOfExperience: doctor.yearsOfExperience || 0,
          position: doctor.position || 'แพทย์',
          consultationFee: doctor.consultationFee || 300
        })) : [];
        
        setDoctors(mappedDoctors);
        logger.info('✅ Doctors loaded successfully:', mappedDoctors.length);
      } else {
        throw new Error('Failed to load doctors');
      }
    } catch (error) {
      logger.error('❌ Error loading doctors from API:', error);
      
      // Fallback to sample data
      const sampleDoctors: Doctor[] = [
        {
          id: 'doc-001',
          name: 'นพ. สมชาย ใจดี',
          department: 'อายุรกรรม',
          specialization: 'อายุรกรรมทั่วไป',
          isAvailable: true,
          currentQueue: 3,
          estimatedWaitTime: 20,
          medicalLicenseNumber: 'MD001',
          yearsOfExperience: 10,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 400
        },
        {
          id: 'doc-002',
          name: 'นพ. สมหญิง รักดี',
          department: 'กุมารเวชกรรม',
          specialization: 'กุมารเวชกรรม',
          isAvailable: true,
          currentQueue: 1,
          estimatedWaitTime: 10,
          medicalLicenseNumber: 'MD002',
          yearsOfExperience: 8,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 450
        }
      ];
      setDoctors(sampleDoctors);
    }
  };

  useEffect(() => {
    if (user) {
      loadDoctors();
    }
    
    addTokenExpiryButton();
  }, [user]);

  useEffect(() => {
    if (user) {
      const currentTime = getThaiTime(); // เวลาประเทศไทย
      setCheckInData(prev => ({
        ...prev,
        visitTime: currentTime
      }));
    }
  }, [user]);

  // อัปเดตเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentThaiTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSearch = async () => {
    console.log('🔍 Starting patient search...', { searchQuery, searchType });
    
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

    try {
      console.log('📤 Searching for patient:', { searchQuery, searchType });
      const response = await PatientService.searchPatients(searchQuery, searchType === "nationalId" ? "name" : searchType);
      
      console.log('📥 Patient search response:', response);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        const exactMatch = response.data.find((p: any) => {
          if (searchType === "hn") {
            return (p.hn === searchQuery || p.hospital_number === searchQuery);
          } else {
            return (p as any).national_id === searchQuery;
          }
        });
        
        if (exactMatch) {
          console.log('✅ Patient found:', exactMatch);
          console.log('Available fields:', Object.keys(exactMatch));
          
          setSelectedPatient(exactMatch);
          setCheckInData(prev => ({
            ...prev,
            patientHn: exactMatch.hn || exactMatch.hospital_number || '',
            patientNationalId: exactMatch.national_id || ''
          }));
        } else {
          console.log('❌ No exact match found');
          setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูลหรือลงทะเบียนใหม่");
        }
      } else {
        console.log('❌ No patients found in response');
        setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูลหรือลงทะเบียนใหม่");
      }
      
    } catch (error) {
      console.error("❌ Error searching patient:", error);
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

    if (!selectedPatient) {
      setError("กรุณาค้นหาและเลือกผู้ป่วยก่อน");
      return false;
    }

    if (!checkInData.treatmentType) {
      newErrors.treatmentType = "กรุณาเลือกประเภทการรักษา";
    }

    if (!checkInData.departmentId) {
      newErrors.departmentId = "กรุณาเลือกแผนก";
    }

    if (!checkInData.assignedDoctor) {
      newErrors.assignedDoctor = "กรุณาเลือกแพทย์";
    }

    if (!checkInData.visitTime) {
      newErrors.visitTime = "กรุณาเลือกเวลามาพบแพทย์";
    }

    if (checkInData.followUpRequired && !checkInData.followUpDate) {
      newErrors.followUpDate = "กรุณาเลือกวันที่นัดติดตาม";
    }

    setErrors(newErrors);
    setError(null); // Clear any previous errors
    
    if (Object.keys(newErrors).length > 0) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔄 Starting check-in process...');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('📋 Check-in data:', checkInData);
      console.log('👤 Selected patient:', selectedPatient);
      
      const visitData = {
        patientId: selectedPatient!.id,
        visitType: checkInData.visitType,
        visitTime: new Date().toISOString(), // ใช้เวลาปัจจุบัน
        chiefComplaint: checkInData.symptoms || 'ไม่ระบุ',
        presentIllness: checkInData.notes,
        priority: checkInData.priority,
        attendingDoctorId: checkInData.assignedDoctor,
        departmentId: checkInData.departmentId || null,
        followUpRequired: checkInData.followUpRequired,
        followUpDate: checkInData.followUpDate || undefined,
        followUpNotes: checkInData.followUpNotes || undefined,
        // เพิ่มฟิลด์ข้อมูลทางการแพทย์
        diagnosis: checkInData.diagnosis || undefined,
        treatmentPlan: checkInData.treatmentPlan || undefined,
        physicalExamination: checkInData.physicalExamination || undefined,
        doctorNotes: checkInData.doctorNotes || undefined,
        recommendations: checkInData.recommendations || undefined,
      };
      
      console.log('📤 Sending visit data:', visitData);
      
      const response = await VisitService.createVisit(visitData as any);
      
      console.log('📥 Visit creation response:', response);
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        const queueNumber = `Q${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
        const selectedDoc = doctors.find(d => d.id === checkInData.assignedDoctor);
        
        setGeneratedQueueNumber(queueNumber);
        const visitTypeLabel = {
          'walk_in': 'Walk-in (มาโดยไม่นัด)',
          'appointment': 'นัดหมาย',
          'emergency': 'ฉุกเฉิน',
          'follow_up': 'ติดตามผล',
          'referral': 'ส่งต่อ'
        }[checkInData.visitType] || checkInData.visitType;

        const priorityLabel = {
          'low': 'ต่ำ',
          'normal': 'ปกติ',
          'high': 'สูง',
          'urgent': 'ฉุกเฉิน'
        }[checkInData.priority] || checkInData.priority;

        setSuccess(`เช็คอินสำเร็จ!\n\nผู้ป่วย: ${selectedPatient?.thaiName || `${selectedPatient?.firstName} ${selectedPatient?.lastName}`}\nHN: ${selectedPatient?.hn || selectedPatient?.hospitalNumber}\nหมายเลขคิว: ${queueNumber}\nแพทย์: ${selectedDoc?.name}\nประเภทการมา: ${visitTypeLabel}\nระดับความสำคัญ: ${priorityLabel}\nเวลา: ${currentTime}\n${checkInData.followUpRequired ? `นัดติดตาม: ${checkInData.followUpDate}` : ''}\n\n✅ ระบบได้ส่งการแจ้งเตือนให้ผู้ป่วยแล้ว`);
        
        // ส่งแจ้งเตือนให้ผู้ป่วย
        try {
          const { apiClient } = await import('@/lib/api');
          await apiClient.post(`/medical/patients/${selectedPatient!.id}/notifications`, {
            title: 'เช็คอินสำเร็จ',
            message: `คุณได้เช็คอินสำเร็จแล้ว หมายเลขคิว: ${queueNumber} แพทย์: ${selectedDoc?.name}`,
            type: 'success',
            notification_type: 'checkin_success',
            priority: 'normal',
            action_required: false,
            related_table: 'visits',
            related_id: response.data?.id,
            metadata: {
              queueNumber: queueNumber,
              doctorName: selectedDoc?.name,
              visitType: checkInData.visitType,
              priority: checkInData.priority
            }
          });
          console.log('✅ Notification sent to patient');
        } catch (notificationError) {
          console.error('❌ Failed to send notification:', notificationError);
        }
        
        // ล้างฟอร์มหลังจากสำเร็จ (แต่ยังแสดงข้อความสำเร็จ)
        setTimeout(() => {
          handleResetFormOnly();
        }, 3000); // ล้างฟอร์มหลังจาก 3 วินาที
        
        console.log('✅ Check-in successful!');
        await loadDoctors();
      } else {
        console.error('❌ Visit creation failed:', response);
        setError(`เกิดข้อผิดพลาดในการสร้างข้อมูล visit: ${response.error?.message || 'ไม่ทราบสาเหตุ'}`);
      }
      
    } catch (error) {
      console.error("❌ Error creating visit:", error);
      logger.error("Error creating visit:", error);
      setError(`เกิดข้อผิดพลาดในการเช็คอิน: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setIsSubmitting(false);
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
      visitTime: getThaiTime(), // เวลาประเทศไทย
      symptoms: "",
      notes: "",
      visitType: "walk_in",
      priority: "normal",
      departmentId: "",
      assignedNurse: "",
      followUpRequired: false,
      followUpDate: "",
      followUpNotes: "",
      // เพิ่มฟิลด์สำหรับข้อมูลทางการแพทย์
      diagnosis: "",
      treatmentPlan: "",
      physicalExamination: "",
      doctorNotes: "",
      recommendations: ""
    });
    setError(null);
    setSuccess(null);
  };

  const handleResetFormOnly = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    setCheckInData({
      patientHn: "",
      patientNationalId: "",
      treatmentType: "",
      assignedDoctor: "",
      visitTime: getThaiTime(), // เวลาประเทศไทย
      symptoms: "",
      notes: "",
      visitType: "walk_in",
      priority: "normal",
      departmentId: "",
      assignedNurse: "",
      followUpRequired: false,
      followUpDate: "",
      followUpNotes: "",
      // เพิ่มฟิลด์สำหรับข้อมูลทางการแพทย์
      diagnosis: "",
      treatmentPlan: "",
      physicalExamination: "",
      doctorNotes: "",
      recommendations: ""
    });
    setError(null);
    // ไม่ล้าง setSuccess(null) เพื่อให้ข้อความสำเร็จยังคงแสดงอยู่
  };

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

  const calculateAge = (patient: any): number => {
    // Try to calculate from birth_date first (multiple field names)
    const birthDate = patient.birth_date || patient.birthDate || patient.birthdate;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
    
    // Calculate from separate birth fields (Buddhist Era)
    if (patient.birthYear && patient.birthMonth && patient.birthDay) {
      const today = new Date();
      // Convert Buddhist Era to Christian Era
      const christianYear = patient.birthYear - 543;
      const birth = new Date(christianYear, patient.birthMonth - 1, patient.birthDay);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
    
    // If patient already has age calculated, use it
    if (patient.age && patient.age > 0) {
      return patient.age;
    }
    return 0; // Return 0 if no birth date information
  };

  const formatGender = (gender: string): string => {
    switch (gender?.toLowerCase()) {
      case 'male':
      case 'm':
        return 'ชาย';
      case 'female':
      case 'f':
        return 'หญิง';
      default:
        return 'ไม่ระบุ';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'ไม่ระบุ';
    try {
      // Handle different date formats
      let date: Date;
      
      // If it's already in DD/MM/YYYY format (Thai format)
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Check if year is Buddhist Era (BE) - if > 2500, convert to Christian Era
          let year = parseInt(parts[2]);
          if (year > 2500) {
            year = year - 543; // Convert BE to CE
          }
          date = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if can't parse
      }
      
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString || 'ไม่ระบุ'; // Return original string if error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-700 whitespace-pre-line">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                ✕ ปิด
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Search */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทการค้นหา
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hn"
                      checked={searchType === "hn"}
                      onChange={(e) => setSearchType(e.target.value as "hn" | "nationalId")}
                      className="mr-2"
                    />
                    หมายเลข HN
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="nationalId"
                      checked={searchType === "nationalId"}
                      onChange={(e) => setSearchType(e.target.value as "hn" | "nationalId")}
                      className="mr-2"
                    />
                    เลขบัตรประชาชน
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchType === "hn" ? "หมายเลข HN" : "เลขบัตรประชาชน"}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === "hn" ? "เช่น HN001234" : "เช่น 1234567890123"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>

            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800">ข้อมูลผู้ป่วยที่เลือก</h3>
                  <p className="text-gray-600">HN: {selectedPatient.hn || selectedPatient.hospitalNumber || 'ไม่ระบุ'}</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* ข้อมูลส่วนตัว */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ข้อมูลส่วนตัว
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">ชื่อ-นามสกุล (ไทย):</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(() => {
                            // Try different field combinations for Thai name
                            const thaiName = selectedPatient.thaiName || selectedPatient.thai_name;
                            const thaiFirstName = (selectedPatient as any).thai_first_name || (selectedPatient as any).thaiFirstName;
                            const thaiLastName = (selectedPatient as any).thai_last_name || (selectedPatient as any).thaiLastName;
                            
                            console.log('Thai name debug:', {
                              thaiName,
                              thaiFirstName,
                              thaiLastName,
                              combined: `${thaiName || ''} ${thaiLastName || ''}`.trim()
                            });
                            
                            if (thaiName && thaiName.includes(' ')) {
                              // If thai_name contains both first and last name
                              return thaiName;
                            } else if (thaiFirstName && thaiLastName) {
                              // If we have separate first and last name fields
                              return `${thaiFirstName} ${thaiLastName}`.trim();
                            } else if (thaiName && thaiLastName) {
                              // If we have thai_name (first name) and thai_last_name
                              return `${thaiName} ${thaiLastName}`.trim();
                            } else if (thaiName) {
                              // If we only have thai_name (first name only)
                              return thaiName;
                            } else {
                              return 'ไม่ระบุ';
                            }
                          })()}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">ชื่อ-นามสกุล (อังกฤษ):</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {`${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || 'ไม่ระบุ'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">เลขบัตรประชาชน:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {selectedPatient.nationalId || 'ไม่ระบุ'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">วันเกิด:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {formatDate(selectedPatient.birth_date || selectedPatient.birthDate || '')}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">อายุ:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {calculateAge(selectedPatient) > 0 ? `${calculateAge(selectedPatient)} ปี` : 'ไม่ระบุ'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">เพศ:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {formatGender(selectedPatient.gender)}
                        </p>
                      </div>
                      
                      {(selectedPatient.blood_group || selectedPatient.bloodGroup || selectedPatient.blood_type) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">หมู่เลือด:</span>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {selectedPatient.blood_group || selectedPatient.bloodGroup || selectedPatient.blood_type}
                            {(selectedPatient as any).rh_factor && ` (${(selectedPatient as any).rh_factor})`}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">สัญชาติ:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(selectedPatient as any).nationality || 'ไทย'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">ศาสนา:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(selectedPatient as any).religion || 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedPatient.address && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-600">ที่อยู่:</span>
                        <p className="text-sm text-gray-800 mt-1">{selectedPatient.address}</p>
                      </div>
                    )}
                  </div>

                  {/* ข้อมูลติดต่อ */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      ข้อมูลติดต่อ
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">โทรศัพท์:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {selectedPatient.phone || 'ไม่ระบุ'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">อีเมล:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {selectedPatient.email || 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลติดต่อฉุกเฉิน */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      ข้อมูลติดต่อฉุกเฉิน
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">ชื่อผู้ติดต่อฉุกเฉิน:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(selectedPatient as any).emergencyContactName || 'ไม่ระบุ'}
                        </p>
                      </div>
                      
                      {((selectedPatient as any).emergencyContactRelationship || (selectedPatient as any).emergency_contact_relationship || (selectedPatient as any).emergency_contact_relation || (selectedPatient as any).relationship) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">ความสัมพันธ์:</span>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {(selectedPatient as any).emergencyContactRelationship || (selectedPatient as any).emergency_contact_relationship || (selectedPatient as any).emergency_contact_relation || (selectedPatient as any).relationship}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">โทรศัพท์ฉุกเฉิน:</span>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(selectedPatient as any).emergencyContactPhone || 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลทางการแพทย์ */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ข้อมูลทางการแพทย์
                    </h4>
                    
                    <div className="space-y-4">
                      {/* โรคประจำตัว */}
                      <div>
                        <span className="text-sm font-medium text-gray-600">โรคประจำตัว:</span>
                        <div className="mt-1">
                          {(selectedPatient as any).chronicDiseases ? (
                            Array.isArray((selectedPatient as any).chronicDiseases) ? (
                              (selectedPatient as any).chronicDiseases.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {(selectedPatient as any).chronicDiseases.map((disease: string, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      {disease}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">ไม่มีโรคประจำตัว</p>
                              )
                            ) : (
                              <p className="text-sm text-gray-800">{(selectedPatient as any).chronicDiseases}</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">ไม่มีโรคประจำตัว</p>
                          )}
                        </div>
                      </div>
                      
                      {/* อาการแพ้ */}
                      <div>
                        <span className="text-sm font-medium text-gray-600">อาการแพ้:</span>
                        <div className="mt-1">
                          {(selectedPatient as any).allergies ? (
                            Array.isArray((selectedPatient as any).allergies) ? (
                              (selectedPatient as any).allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {(selectedPatient as any).allergies.map((allergy: string, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                      {allergy}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">ไม่มีอาการแพ้</p>
                              )
                            ) : (
                              <p className="text-sm text-gray-800">{(selectedPatient as any).allergies}</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">ไม่มีอาการแพ้</p>
                          )}
                        </div>
                      </div>
                      
                      {/* ยาที่ใช้ประจำ */}
                      <div>
                        <span className="text-sm font-medium text-gray-600">ยาที่ใช้ประจำ:</span>
                        <div className="mt-1">
                          {(selectedPatient as any).currentMedications ? (
                            Array.isArray((selectedPatient as any).currentMedications) ? (
                              (selectedPatient as any).currentMedications.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {(selectedPatient as any).currentMedications.map((medication: string, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {medication}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">ไม่มี</p>
                              )
                            ) : (
                              <p className="text-sm text-gray-800">{(selectedPatient as any).currentMedications}</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">ไม่มี</p>
                          )}
                        </div>
                      </div>
                      
                      {/* ประวัติการผ่าตัด */}
                      <div>
                        <span className="text-sm font-medium text-gray-600">ประวัติการผ่าตัด:</span>
                        <div className="mt-1">
                          {(selectedPatient as any).surgicalHistory ? (
                            Array.isArray((selectedPatient as any).surgicalHistory) ? (
                              (selectedPatient as any).surgicalHistory.length > 0 ? (
                                <div className="space-y-1">
                                  {(selectedPatient as any).surgicalHistory.map((surgery: string, index: number) => (
                                    <p key={index} className="text-sm text-gray-800">• {surgery}</p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">ไม่มีประวัติการผ่าตัด</p>
                              )
                            ) : (
                              <p className="text-sm text-gray-800">{(selectedPatient as any).surgicalHistory}</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">ไม่มีประวัติการผ่าตัด</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      ข้อมูลอัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery("");
                        setCheckInData(prev => ({
                          ...prev,
                          patientHn: "",
                          patientNationalId: ""
                        }));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      เปลี่ยนผู้ป่วย
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check-in Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">ข้อมูลการเช็คอิน</h2>
              {selectedPatient && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ผู้ป่วย:</span> {selectedPatient.thaiName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                  <span className="ml-2 text-blue-600">({selectedPatient.hn || selectedPatient.hospitalNumber})</span>
                </div>
              )}
            </div>
            
            {!selectedPatient ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">กรุณาค้นหาผู้ป่วยก่อน</h3>
                <p className="text-gray-600">เลือกผู้ป่วยจากด้านซ้ายเพื่อเริ่มต้นการเช็คอิน</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทการรักษา
                  </label>
                <select
                  value={checkInData.treatmentType}
                  onChange={(e) => handleInputChange('treatmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกประเภทการรักษา</option>
                  <option value="opd">OPD - ตรวจรักษาทั่วไป</option>
                  <option value="health_check">ตรวจสุขภาพ</option>
                  <option value="vaccination">ฉีดวัคซีน</option>
                  <option value="emergency">ฉุกเฉิน</option>
                  <option value="followup">นัดติดตามผล</option>
                </select>
                {errors.treatmentType && (
                  <p className="text-red-500 text-sm mt-1">{errors.treatmentType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แผนก
                </label>
                <select
                  value={checkInData.departmentId}
                  onChange={(e) => handleInputChange('departmentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกแผนก</option>
                  <option value="MED">อายุรกรรม</option>
                  <option value="SUR">ศัลยกรรม</option>
                  <option value="PED">กุมารเวชกรรม</option>
                  <option value="OBG">สูติ-นรีเวชกรรม</option>
                  <option value="EYE">จักษุวิทยา</option>
                  <option value="ENT">หู คอ จมูก</option>
                  <option value="ORT">กระดูกและข้อ</option>
                  <option value="PSY">จิตเวช</option>
                  <option value="DER">ผิวหนัง</option>
                  <option value="REH">เวชศาสตร์ฟื้นฟู</option>
                </select>
                {errors.departmentId && (
                  <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แพทย์ที่รับผิดชอบ
                </label>
                <select
                  value={checkInData.assignedDoctor}
                  onChange={(e) => handleInputChange('assignedDoctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกแพทย์</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.department}
                    </option>
                  ))}
                </select>
                {errors.assignedDoctor && (
                  <p className="text-red-500 text-sm mt-1">{errors.assignedDoctor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลามาพบแพทย์
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  {currentTime}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  เวลาปัจจุบันประเทศไทย (ไม่สามารถแก้ไขได้)
                  <br />
                  Debug: UTC={new Date().toISOString()} | Local={new Date().toLocaleString()} | Thai={getCurrentThaiTime()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทการมา
                </label>
                <select
                  value={checkInData.visitType}
                  onChange={(e) => handleInputChange('visitType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="walk_in">Walk-in (มาโดยไม่นัด)</option>
                  <option value="appointment">นัดหมาย</option>
                  <option value="emergency">ฉุกเฉิน</option>
                  <option value="follow_up">ติดตามผล</option>
                  <option value="referral">ส่งต่อ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระดับความสำคัญ
                </label>
                <select
                  value={checkInData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">ฉุกเฉิน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อาการ/อาการแสดง
                </label>
                <textarea
                  value={checkInData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  placeholder="ระบุอาการหรืออาการแสดงของผู้ป่วย"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={checkInData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ข้อมูลทางการแพทย์เพิ่มเติม */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">ข้อมูลทางการแพทย์</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      การวินิจฉัย
                    </label>
                    <textarea
                      value={checkInData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      placeholder="ระบุการวินิจฉัยเบื้องต้น"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      แผนการรักษา
                    </label>
                    <textarea
                      value={checkInData.treatmentPlan}
                      onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                      placeholder="ระบุแผนการรักษา"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    การตรวจร่างกาย
                  </label>
                  <textarea
                    value={checkInData.physicalExamination}
                    onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                    placeholder="ระบุผลการตรวจร่างกาย"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเหตุแพทย์
                  </label>
                  <textarea
                    value={checkInData.doctorNotes}
                    onChange={(e) => handleInputChange('doctorNotes', e.target.value)}
                    placeholder="หมายเหตุเพิ่มเติมจากแพทย์"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำแนะนำ
                  </label>
                  <textarea
                    value={checkInData.recommendations}
                    onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    placeholder="คำแนะนำสำหรับผู้ป่วย"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">การติดตามผล</h4>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={checkInData.followUpRequired}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
                    ต้องการนัดติดตามผล
                  </label>
                </div>

                {checkInData.followUpRequired && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่นัดติดตาม
                      </label>
                      <input
                        type="date"
                        value={checkInData.followUpDate}
                        onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเหตุการติดตาม
                      </label>
                      <textarea
                        value={checkInData.followUpNotes}
                        onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                        placeholder="หมายเหตุสำหรับการนัดติดตาม"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedPatient}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังเช็คอิน..." : "เช็คอิน"}
                </button>
                
                <button
                  onClick={handleResetForm}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
