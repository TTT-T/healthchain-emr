"use client";
import { useState, useEffect } from "react";
import { Search, Calendar, Plus, Edit, Trash2, CheckCircle, AlertCircle, Clock, User, Heart, Activity, Brain, Database, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { AppointmentService } from '@/services/appointmentService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

export default function Appointments() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [appointmentData, setAppointmentData] = useState({
    doctorId: '',
    appointmentType: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    duration: 30,
    reason: '',
    notes: '',
    status: 'scheduled',
    priority: 'normal',
    location: '',
    reminderSent: false,
    followUpRequired: false,
    followUpDate: '',
    createdBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่",
    // AI Research Fields for Appointments
    aiResearchData: {
      appointmentComplexity: '', // ความซับซ้อนของการนัดหมาย
      expectedDuration: '', // ระยะเวลาที่คาดหวัง
      resourceRequirements: '', // ความต้องการทรัพยากร
      riskAssessment: '', // การประเมินความเสี่ยง
      followUpNeeds: '', // ความต้องการติดตาม
      patientCompliance: '', // การปฏิบัติตามนัดหมาย
      appointmentOutcome: '', // ผลลัพธ์ของการนัดหมาย
      schedulingOptimization: '', // การปรับปรุงการจัดตาราง
      resourceUtilization: '', // การใช้ทรัพยากร
      researchNotes: '' // หมายเหตุสำหรับการวิจัย
    }
  });

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Update createdBy when user changes
  useEffect(() => {
    if (user) {
      const staffName = user.thaiName || `${user.firstName} ${user.lastName}` || "เจ้าหน้าที่";
      setAppointmentData(prev => ({
        ...prev,
        createdBy: staffName
      }));
    }
  }, [user]);

  // Reset doctorId when doctors array changes
  useEffect(() => {
    if (doctors.length === 0 && appointmentData.doctorId) {
      logger.warn('Doctors array is empty, resetting doctorId');
      setAppointmentData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [doctors, appointmentData.doctorId]);

  // Age calculation function
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return Math.max(0, age);
    } catch (error) {
      logger.error("Error calculating age from birthDate:", error);
      return 0;
    }
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

  const loadDoctors = async () => {
    try {
      logger.info('Loading doctors from API...');
      // Load real doctors from API using apiClient (with authentication)
      const response = await apiClient.get('/medical/doctors?limit=100');
      
      logger.info('Doctors API response:', { 
        statusCode: response.statusCode, 
        dataLength: Array.isArray(response.data) ? response.data.length : 0 || 0,
        data: Array.isArray(response.data) ? Array.isArray(response.data) ? response.data : []: [] 
      });
      
      if (response.statusCode === 200 && response.data) {
        logger.info('Successfully loaded doctors from API:', response.data);
        setDoctors(Array.isArray(response.data) ? response.data : []);
      } else {
        logger.warn('Failed to load doctors from API, no doctors available');
        setDoctors([]);
      }
    } catch (error) {
      logger.error('Error loading doctors from API:', error);
      setDoctors([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search request timeout')), 15000); // 15 second timeout
      });
      
      const searchPromise = PatientService.searchPatients(searchQuery, searchType);
      
      const response = await Promise.race([searchPromise, timeoutPromise]) as any;

      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        logger.info("Patient found:", response.data[0]);
        setSelectedPatient(response.data[0]);
        setError(null);
        
        // Load appointments without showing error if none found
        try {
          await loadPatientAppointments(response.data[0].id);
        } catch (appointmentError) {
          logger.warn("Failed to load appointments, but patient search was successful:", appointmentError);
          // Don't set error here, just log it - patient search was successful
        }
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
        setAppointments([]);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      
      // Handle different types of errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('timeout')) {
          setError("การค้นหาใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง");
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
          setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
        } else {
          setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
        }
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการค้นหา");
      }
      
      setSelectedPatient(null);
      setAppointments([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientAppointments = async (patientId: string) => {
    try {
      logger.info("Loading appointments for patient:", { patientId });
      
      // Check if patientId is valid
      if (!patientId || patientId.trim() === '') {
        logger.warn("Invalid patientId provided:", patientId);
        setAppointments([]);
        return;
      }
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const responsePromise = AppointmentService.getAppointmentsByPatient(patientId);
      
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;

      if (response && (response.statusCode === 200 || response.statusCode === 404) && response.data) {
        logger.info("Successfully loaded appointments:", response.data);
        
        // The appointments are in response.data.appointments
        const appointmentsData = response.data.appointments || [];
        
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        // Clear any previous errors
        setError(null);
      } else if (response && response.statusCode === 404) {
        // 404 means no appointments found, which is normal
        logger.info("No appointments found (404) - this is normal for new patients");
        setAppointments([]);
        setError(null);
      } else {
        logger.warn("No appointments found or invalid response:", response);
        setAppointments([]);
        // Don't show error for empty results, just show empty list
      }
    } catch (error) {
      // Don't set sample data, just show empty list
      setAppointments([]);
      
      // Add detailed error logging for debugging
      logger.error("Error loading appointments:", error);
      console.error("Appointment loading error:", error);
      
      // Check for 404 error first (most common case) - this is expected for new patients
      if (error && typeof error === 'object') {
        // Check for axios error structure
        if ('response' in error) {
          const response = (error as any).response;
          logger.error("API Error Response:", {
            status: response?.status,
            statusText: response?.statusText,
            data: response?.data
          });
          console.error("API Error Response:", response);
          
          if (response && response.status === 404) {
            logger.info("Appointments endpoint not found (404) - this is normal for new patients");
            // Don't show error for 404, just show empty list
            return;
          }
        }
        
        // Check for error message
        if ('message' in error) {
          const errorMessage = (error as Error).message;
          
          if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            // Patient has no appointments, this is normal
            logger.info("Patient has no appointments, showing empty list");
            return;
          } else if (errorMessage.includes('timeout')) {
            // Request timeout
            logger.warn("Request timeout when loading appointments");
            setError("การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง");
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            // Network error
            logger.warn("Network error when loading appointments");
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
          } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
            // Server error
            logger.warn("Server error when loading appointments");
            setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
          } else if (errorMessage.includes('API request failed')) {
            // API request failed - this is the specific error we're seeing
            // Check if it's a 404 error by looking at the error object
            if (error && typeof error === 'object' && 'response' in error) {
              const response = (error as any).response;
              if (response && response.status === 404) {
                logger.info("API request failed with 404 - this is normal for new patients");
                return;
              }
            }
            logger.warn("API request failed when loading appointments");
            setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
          } else {
            // Other errors
            logger.warn("Unknown error when loading appointments:", errorMessage);
            setError("ไม่สามารถโหลดข้อมูลนัดหมายได้ กรุณาลองใหม่อีกครั้ง");
          }
        } else {
          // Unknown error type
          logger.warn("Unknown error type when loading appointments:", error);
          setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง");
        }
      } else {
        // Unknown error type
        logger.warn("Unknown error type when loading appointments:", error);
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    //  logging
    logger.info(' selectedPatient data:', {
      selectedPatientId: selectedPatient.id,
      selectedPatientHn: selectedPatient.hospitalNumber,
      selectedPatientName: selectedPatient.thaiName || `${selectedPatient.firstName} ${selectedPatient.lastName}`
    });
    
    // Validate data
    const validation = AppointmentService.validateAppointmentData(appointmentData);
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    // Additional validation for doctorId
    if (!appointmentData.doctorId) {
      setError('กรุณาเลือกแพทย์ผู้ตรวจ');
      return;
    }

    // Check if selected doctor exists in doctors array
    const selectedDoctor = doctors.find(doctor => doctor.id === appointmentData.doctorId);
    if (!selectedDoctor) {
      logger.error('Selected doctor not found in doctors array:', {
        selectedDoctorId: appointmentData.doctorId,
        availableDoctors: doctors.map(d => ({ id: d.id, name: d.name }))
      });
      setError('แพทย์ที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่');
      setAppointmentData(prev => ({ ...prev, doctorId: '' }));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = AppointmentService.formatAppointmentDataForAPI(
        appointmentData,
        selectedPatient.id,
        user?.id || 'system'
      );
      
      logger.info(' formatted data:', formattedData);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Submit request timeout')), 20000); // 20 second timeout
      });
      
      const submitPromise = AppointmentService.createAppointment(formattedData);
      
      const response = await Promise.race([submitPromise, timeoutPromise]) as any;

      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("สร้างนัดหมายสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reload appointments
        await loadPatientAppointments(selectedPatient.id);
        
        // Reset form
        setTimeout(() => {
          setAppointmentData({
            doctorId: '',
            appointmentType: '',
            appointmentDate: '',
            appointmentTime: '09:00',
            duration: 30,
            reason: '',
            notes: '',
            status: 'scheduled',
            priority: 'normal',
            location: '',
            reminderSent: false,
            followUpRequired: false,
            followUpDate: '',
            createdBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่",
            // Reset AI Research Data
            aiResearchData: {
              appointmentComplexity: '',
              expectedDuration: '',
              resourceRequirements: '',
              riskAssessment: '',
              followUpNeeds: '',
              patientCompliance: '',
              appointmentOutcome: '',
              schedulingOptimization: '',
              resourceUtilization: '',
              researchNotes: ''
            }
          });
          setShowForm(false);
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
      }
    } catch (error) {
      logger.error("Error creating appointment:", error);
      
      // Handle different types of errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('timeout')) {
          setError("การบันทึกข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง");
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
          setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
        } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
          setError("ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง");
        } else {
          setError("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
        }
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการสร้างนัดหมาย");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, appointmentRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'appointment',
        recordId: appointmentRecord.id,
        chiefComplaint: `นัดหมาย: ${appointmentRecord.appointmentType}`,
        recordedBy: appointmentRecord.createdBy,
        recordedTime: appointmentRecord.created_at,
        message: `มีการสร้างนัดหมายใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${appointmentRecord.createdBy}`
      };

      // Add timeout for notification
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Notification timeout')), 5000); // 5 second timeout
      });
      
      const notificationPromise = NotificationService.notifyPatientRecordUpdate(notificationData);
      
      await Promise.race([notificationPromise, timeoutPromise]);
      logger.info('Patient notification sent for appointment', {
        patientHn: notificationData.patientHn,
        recordId: appointmentRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for appointment:', error);
      // Don't throw error, just log it - notification failure shouldn't break the main flow
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบนัดหมายนี้?')) return;
    
    try {
      // Add timeout for delete request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Delete request timeout')), 10000); // 10 second timeout
      });
      
      const deletePromise = AppointmentService.deleteAppointment(appointmentId);
      
      const response = await Promise.race([deletePromise, timeoutPromise]) as any;

      if (response.statusCode === 200) {
        setSuccess("ลบนัดหมายสำเร็จ");
        if (selectedPatient) {
          await loadPatientAppointments(selectedPatient.id);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการลบนัดหมาย");
      }
    } catch (error) {
      logger.error("Error deleting appointment:", error);
      
      // Handle different types of errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('timeout')) {
          setError("การลบข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง");
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
          setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          setError("ไม่พบนัดหมายที่ต้องการลบ");
        } else {
          setError("เกิดข้อผิดพลาดในการลบนัดหมาย");
        }
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการลบนัดหมาย");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบนัดหมาย</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, appointmentData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'appointment',
        appointmentData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.national_id || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for appointment', { 
        patientHn: patient.hn,
        recordType: 'appointment'
      });
    } catch (error) {
      logger.error('Error creating patient document for appointment:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างนัดหมาย
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการนัดหมาย</h1>
              <p className="text-gray-600">สร้างและจัดการนัดหมายผู้ป่วย</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType("hn")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "hn"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ค้นหาด้วย HN
              </button>
              <button
                onClick={() => setSearchType("queue")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "queue"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ค้นหาด้วยคิว
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN เช่น HN250001" : "กรอกหมายเลขคิว"}
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

          {/* Comprehensive Patient Information for Appointments */}
          {selectedPatient && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">ข้อมูลผู้ป่วยสำหรับการนัดหมาย</h3>
                    <p className="text-blue-600">ข้อมูลครบถ้วนเพื่อการจัดตารางนัดหมายที่เหมาะสม</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {showForm ? "ปิดฟอร์ม" : "สร้างนัดหมาย"}
                </button>
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
                      <span className="font-bold text-blue-600">{selectedPatient.hospitalNumber || selectedPatient.hn}</span>
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

                {/* Current Status */}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    สถานะปัจจุบัน
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
                      <span className="font-medium text-green-600">พร้อมนัดหมาย</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment-Specific Information */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  ข้อมูลสำหรับการนัดหมาย
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">ประวัติการนัดหมาย:</span>
                    <p className="text-slate-800 mt-1">ไม่มีข้อมูล</p>
                  </div>
                  <div>
                    <span className="text-slate-600">ความต้องการพิเศษ:</span>
                    <p className="text-slate-800 mt-1">ไม่มีข้อมูล</p>
                  </div>
                </div>
              </div>

              {/* Instructions for Appointment Scheduling */}
              <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">คำแนะนำสำหรับการจัดตารางนัดหมาย:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• พิจารณาโรคประจำตัวและยาที่ใช้อยู่ในการกำหนดระยะเวลา</li>
                      <li>• ตรวจสอบประวัติการแพ้ยาและอาหารก่อนนัดหมาย</li>
                      <li>• ใช้ข้อมูลน้ำหนักและส่วนสูงในการประเมินความต้องการ</li>
                      <li>• บันทึกข้อมูลให้ครบถ้วนเพื่อการวิจัยและพัฒนาระบบ AI</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Form */}
          {selectedPatient && showForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สร้างนัดหมายใหม่</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทนัดหมาย *
                  </label>
                  <select
                    value={appointmentData.appointmentType}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">เลือกประเภทนัดหมาย</option>
                    <option value="ตรวจสุขภาพ">ตรวจสุขภาพ</option>
                    <option value="ติดตามผล">ติดตามผล</option>
                    <option value="ฉีดวัคซีน">ฉีดวัคซีน</option>
                    <option value="ตรวจพิเศษ">ตรวจพิเศษ</option>
                    <option value="ปรึกษา">ปรึกษา</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    แพทย์ผู้ตรวจ
                  </label>
                  <select
                    value={appointmentData.doctorId}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">
                      {doctors.length > 0 ? "เลือกแพทย์" : "ไม่มีแพทย์ในระบบ"}
                    </option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่นัดหมาย *
                  </label>
                  <input
                    type="date"
                    value={appointmentData.appointmentDate}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลานัดหมาย *
                  </label>
                  <input
                    type="time"
                    value={appointmentData.appointmentTime}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระยะเวลา (นาที)
                  </label>
                  <select
                    value={appointmentData.duration}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 นาที</option>
                    <option value={30}>30 นาที</option>
                    <option value={45}>45 นาที</option>
                    <option value={60}>60 นาที</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความสำคัญ
                  </label>
                  <select
                    value={appointmentData.priority}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="normal">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="urgent">ด่วน</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลในการนัดหมาย *
                </label>
                <textarea
                  value={appointmentData.reason}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกเหตุผลในการนัดหมาย"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่นัดหมาย
                </label>
                <input
                  type="text"
                  value={appointmentData.location}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น ห้องตรวจ 1, คลินิกเฉพาะทาง"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>
              
              {/* AI Research Data Section for Appointments */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800">ข้อมูลสำหรับ AI และการวิจัยการนัดหมาย</h3>
                    <p className="text-purple-600">ข้อมูลเพิ่มเติมเพื่อการพัฒนาระบบ AI และการวิจัยการนัดหมาย</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appointment Analysis */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">การวิเคราะห์การนัดหมาย</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความซับซ้อนของการนัดหมาย
                        </label>
                        <select
                          value={appointmentData.aiResearchData.appointmentComplexity}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, appointmentComplexity: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกความซับซ้อน</option>
                          <option value="simple">ง่าย - การตรวจพื้นฐาน</option>
                          <option value="moderate">ปานกลาง - การตรวจทั่วไป</option>
                          <option value="complex">ซับซ้อน - การตรวจพิเศษ</option>
                          <option value="very_complex">ซับซ้อนมาก - การผ่าตัดหรือการรักษาเฉพาะ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ระยะเวลาที่คาดหวัง
                        </label>
                        <select
                          value={appointmentData.aiResearchData.expectedDuration}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, expectedDuration: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกระยะเวลา</option>
                          <option value="short">สั้น - น้อยกว่า 15 นาที</option>
                          <option value="medium">ปานกลาง - 15-30 นาที</option>
                          <option value="long">ยาว - 30-60 นาที</option>
                          <option value="very_long">ยาวมาก - มากกว่า 60 นาที</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          การประเมินความเสี่ยง
                        </label>
                        <select
                          value={appointmentData.aiResearchData.riskAssessment}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, riskAssessment: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกความเสี่ยง</option>
                          <option value="low">ต่ำ - ไม่มีความเสี่ยง</option>
                          <option value="medium">ปานกลาง - มีความเสี่ยงเล็กน้อย</option>
                          <option value="high">สูง - มีความเสี่ยง</option>
                          <option value="critical">วิกฤต - มีความเสี่ยงสูง</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Resource & Follow-up */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">ทรัพยากรและการติดตาม</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความต้องการทรัพยากร
                        </label>
                        <textarea
                          value={appointmentData.aiResearchData.resourceRequirements}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, resourceRequirements: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น เครื่องมือพิเศษ, ห้องตรวจเฉพาะ, เจ้าหน้าที่เพิ่มเติม"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความต้องการติดตาม
                        </label>
                        <select
                          value={appointmentData.aiResearchData.followUpNeeds}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, followUpNeeds: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกความต้องการติดตาม</option>
                          <option value="none">ไม่ต้องติดตาม</option>
                          <option value="minimal">ติดตามน้อย - ตามปกติ</option>
                          <option value="moderate">ติดตามปานกลาง - ตามกำหนด</option>
                          <option value="intensive">ติดตามเข้มข้น - ใกล้ชิด</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          การปฏิบัติตามนัดหมาย
                        </label>
                        <select
                          value={appointmentData.aiResearchData.patientCompliance}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, patientCompliance: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกการปฏิบัติตาม</option>
                          <option value="excellent">ดีมาก - มานัดหมายตรงเวลาเสมอ</option>
                          <option value="good">ดี - มานัดหมายตรงเวลาส่วนใหญ่</option>
                          <option value="fair">ปานกลาง - บางครั้งมาสายหรือไม่มา</option>
                          <option value="poor">ไม่ดี - มักไม่มาตามนัดหมาย</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional AI Research Fields */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ผลลัพธ์ของการนัดหมาย
                    </label>
                    <textarea
                      value={appointmentData.aiResearchData.appointmentOutcome}
                      onChange={(e) => setAppointmentData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, appointmentOutcome: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น การนัดหมายสำเร็จ, ผู้ป่วยไม่มา, ต้องเลื่อนนัด"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      การปรับปรุงการจัดตาราง
                    </label>
                    <textarea
                      value={appointmentData.aiResearchData.schedulingOptimization}
                      onChange={(e) => setAppointmentData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, schedulingOptimization: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น ควรจัดเวลาเพิ่ม, ควรจัดช่วงเวลาที่เหมาะสมกว่า"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    หมายเหตุสำหรับการวิจัยการนัดหมาย
                  </label>
                  <textarea
                    value={appointmentData.aiResearchData.researchNotes}
                    onChange={(e) => setAppointmentData(prev => ({
                      ...prev,
                      aiResearchData: { ...prev.aiResearchData, researchNotes: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="ข้อมูลเพิ่มเติมที่สำคัญสำหรับการวิจัยการนัดหมายและพัฒนาระบบ AI"
                  />
                </div>

                <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">ประโยชน์ของข้อมูล AI Research สำหรับการนัดหมาย:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• ช่วยพัฒนาระบบ AI ในการจัดตารางนัดหมายที่เหมาะสม</li>
                        <li>• ใช้ในการวิจัยเพื่อหาปัจจัยที่ส่งผลต่อการปฏิบัติตามนัดหมาย</li>
                        <li>• ปรับปรุงการจัดการทรัพยากรและการจัดตาราง</li>
                        <li>• สร้างฐานข้อมูลสำหรับการวิเคราะห์แนวโน้มการนัดหมาย</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างนัดหมาย"}
                </button>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {selectedPatient && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">รายการนัดหมาย</h3>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => {
                    // Debug: Log appointment structure
                    console.log('Appointment object:', appointment);
                    console.log('Date fields:', {
                      appointment_date: appointment.appointment_date,
                      appointment_time: appointment.appointment_time
                    });
                    
                    return (
                    <div key={appointment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {typeof appointment.title === 'object' 
                                ? (appointment.title.display || appointment.title.name || appointment.title.text || JSON.stringify(appointment.title))
                                : appointment.title || 'ไม่ระบุหัวข้อ'
                              }
                            </span>
                            <span className="text-gray-500">
                              {AppointmentService.formatDateTime(
                                appointment.appointment_date,
                                appointment.appointment_time
                              )}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${AppointmentService.getStatusColor(appointment.status)}`}>
                              {AppointmentService.getStatusLabel(appointment.status)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${AppointmentService.getPriorityColor(appointment.priority)}`}>
                              {AppointmentService.getPriorityLabel(appointment.priority)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">ประเภท:</span> {
                                typeof appointment.appointment_type === 'object' 
                                  ? (appointment.appointment_type.display || appointment.appointment_type.name || appointment.appointment_type.type || JSON.stringify(appointment.appointment_type))
                                  : (appointment.appointment_type || 'ไม่ระบุ')
                              }
                            </div>
                            <div>
                              <span className="font-medium">คำอธิบาย:</span> {
                                typeof appointment.description === 'object' 
                                  ? (appointment.description.display || appointment.description.name || appointment.description.text || JSON.stringify(appointment.description))
                                  : appointment.description || 'ไม่ระบุ'
                              }
                            </div>
                            {appointment.doctor && (
                              <div>
                                <span className="font-medium">แพทย์:</span> {appointment.doctor.thaiName}
                              </div>
                            )}
                            {appointment.location && (
                              <div>
                                <span className="font-medium">สถานที่:</span> {
                                  typeof appointment.location === 'object' 
                                    ? appointment.location.name || JSON.stringify(appointment.location)
                                    : appointment.location
                                }
                              </div>
                            )}
                          </div>
                          
                          {appointment.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">หมายเหตุ:</span> {
                                typeof appointment.notes === 'object' 
                                  ? (appointment.notes.display || appointment.notes.name || appointment.notes.text || JSON.stringify(appointment.notes))
                                  : appointment.notes
                              }
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="ลบนัดหมาย"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">ไม่มีนัดหมาย</h4>
                  <p className="text-gray-600 mb-4">ผู้ป่วยนี้ยังไม่มีนัดหมายในระบบ</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    สร้างนัดหมายใหม่
                  </button>
                </div>
              )}
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