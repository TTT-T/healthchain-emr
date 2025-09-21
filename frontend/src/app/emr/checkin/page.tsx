"use client";
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
import { addTokenExpiryTestButton } from '@/utils/tokenExpiryTest';
import { createLocalDateTimeString, formatToBuddhistEra, debugTimeInfo } from '@/utils/timeUtils';

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

// Doctor interface is now imported from DoctorService

interface CheckInData {
  patientHn: string;
  patientNationalId: string;
  treatmentType: string;
  assignedDoctor: string;
  visitTime: string;
  symptoms: string;
  notes: string;
}

// Time utility functions are now imported from @/utils/timeUtils

export default function CheckIn() {
  const { isAuthenticated, user } = useAuth();
  
  // Debug logging for user data
  useEffect(() => {
    console.log('🔍 Auth status check:', { isAuthenticated, user: !!user });
    if (user) {
      console.log('🔍 User data in checkin page:', {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        thaiFirstName: user.thaiFirstName,
        thaiLastName: user.thaiLastName,
        position: user.position,
        role: user.role,
        departmentId: user.departmentId,
        allFields: Object.keys(user)
      });
    } else {
      console.log('❌ No user data available');
    }
  }, [user, isAuthenticated]);

  // Update time to current time when page loads
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      
      // Debug time information
      debugTimeInfo(now);
      
      // Create local datetime string in YYYY-MM-DDTHH:MM format
      const currentTimeString = createLocalDateTimeString(now);
      
      setCheckInData(prev => ({
        ...prev,
        visitTime: currentTimeString
      }));
      
      setSelectedDate(now);
      setSelectedTime({
        hours: now.getHours(),
        minutes: now.getMinutes()
      });
    };

    // Update immediately
    updateCurrentTime();
    
    // Update every minute to keep time current
    const interval = setInterval(updateCurrentTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
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
    visitTime: createLocalDateTimeString(new Date()), // เวลาปัจจุบันเสมอ
    symptoms: "",
    notes: ""
  });

  // Modal calendar state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // วันที่ปัจจุบัน
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  });

  const [errors, setErrors] = useState<Partial<CheckInData>>({});

  // Real doctors data - will be loaded from API
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Debug doctors state changes
  useEffect(() => {
    console.log('🔍 Doctors state changed:', doctors.length, 'doctors');
    console.log('🔍 Doctors data:', doctors);
  }, [doctors]);

  const treatmentTypes = [
    { value: "opd", label: "OPD - ตรวจรักษาทั่วไป", icon: "🏥", color: "blue" },
    { value: "health_check", label: "ตรวจสุขภาพ", icon: "🩺", color: "green" },
    { value: "vaccination", label: "ฉีดวัคซีน", icon: "💉", color: "purple" },
    { value: "emergency", label: "ฉุกเฉิน", icon: "🚨", color: "red" },
    { value: "followup", label: "นัดติดตามผล", icon: "📋", color: "orange" }
  ];

  // Load real doctors data from API
  const loadDoctors = async () => {
    try {
      console.log('🔄 Loading doctors from API...');
      logger.debug('🔄 Loading doctors from API...');
      const response = await DoctorService.getAvailableDoctors();
      console.log('📡 API Response:', response);
      
      if (response.statusCode === 200 && response.data) {
        logger.debug('✅ Doctors loaded successfully:', response.data);
        
        // Map API response to frontend Doctor interface
        const mappedDoctors: Doctor[] = response.data.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.name || doctor.thaiName || `${doctor.firstName} ${doctor.lastName}`,
          department: doctor.department,
          specialization: doctor.specialization,
          currentQueue: doctor.currentQueue || doctor.queueCount || 0,
          estimatedWaitTime: doctor.estimatedWaitTime || 0,
          isAvailable: doctor.isAvailable || doctor.isActive,
          medicalLicenseNumber: doctor.medicalLicenseNumber,
          yearsOfExperience: doctor.yearsOfExperience,
          position: doctor.position,
          consultationFee: doctor.consultationFee,
          email: doctor.email,
          phone: doctor.phone,
          availability: doctor.availability
        }));
        
        logger.debug('📱 Mapped doctors:', mappedDoctors);
        console.log('📱 Mapped doctors:', mappedDoctors);
        setDoctors(mappedDoctors);
        console.log('✅ Doctors state updated with', mappedDoctors.length, 'doctors');
        return;
      } else {
        throw new Error('Failed to load doctors');
      }
    } catch (error) {
      logger.error('❌ Error loading doctors from API:', error);
      console.error('❌ Error loading doctors from API:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Fallback to sample data if API fails
      logger.debug('🔄 Using fallback sample doctors data...');
      console.log('🔄 Using fallback sample doctors data...');
      const sampleDoctors: Doctor[] = [
        {
          id: 'doc-001',
          name: 'นพ. สมชาย ใจดี',
          department: 'อายุรกรรม',
          specialization: 'โรคหัวใจ',
          isAvailable: true,
          currentQueue: 3,
          estimatedWaitTime: 15,
          medicalLicenseNumber: 'MD001',
          yearsOfExperience: 10,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 500
        },
        {
          id: 'doc-002', 
          name: 'นพ. สมหญิง รักสุขภาพ',
          department: 'กุมารเวชกรรม',
          specialization: 'โรคติดเชื้อ',
          isAvailable: true,
          currentQueue: 1,
          estimatedWaitTime: 5,
          medicalLicenseNumber: 'MD002',
          yearsOfExperience: 8,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 450
        },
        {
          id: 'doc-003',
          name: 'นพ. สมศักดิ์ ใจงาม',
          department: 'ศัลยกรรม',
          specialization: 'ศัลยกรรมทั่วไป',
          isAvailable: true,
          currentQueue: 2,
          estimatedWaitTime: 10,
          medicalLicenseNumber: 'MD003',
          yearsOfExperience: 15,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 600
        },
        {
          id: 'doc-004',
          name: 'นพ. สมพร รักงาน',
          department: 'สูติ-นรีเวช',
          specialization: 'สูติกรรม',
          isAvailable: true,
          currentQueue: 0,
          estimatedWaitTime: 0,
          medicalLicenseNumber: 'MD004',
          yearsOfExperience: 12,
          position: 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: 550
        }
      ];
      
      console.log('🔄 Setting fallback doctors:', sampleDoctors);
      setDoctors(sampleDoctors);
      console.log('✅ Fallback doctors state updated with', sampleDoctors.length, 'doctors');
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered, isAuthenticated:', isAuthenticated);
    console.log('🔍 useEffect triggered, user:', !!user);
    if (isAuthenticated) {
      console.log('🔄 Loading doctors...');
      loadDoctors();
    } else {
      console.log('❌ Not authenticated, skipping doctors load');
      console.log('❌ Auth details:', { isAuthenticated, user: !!user });
    }
    
    // Add test button for development
    addTokenExpiryTestButton();
  }, [isAuthenticated, user]);

  // Update visit time to current time when component mounts or when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const currentTime = createLocalDateTimeString(new Date());
      setCheckInData(prev => ({
        ...prev,
        visitTime: currentTime
      }));
    }
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
      // Search by hn for HN search, by name for national ID search
      const searchBy = searchType === "hn" ? "hn" : "name";
      const response = await PatientService.searchPatients(searchQuery, searchBy);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        // Find exact match
        const exactMatch = response.data.find((p: any) => {
          if (searchType === "hn") {
            // Check both hn and hospital_number fields, and also check if the search query matches
            const hnMatch = (p as any).hn === searchQuery;
            const hospitalNumberMatch = (p as any).hospital_number === searchQuery;
            const hospitalNumberUpperMatch = (p as any).hospital_number === searchQuery.toUpperCase();
            
            console.log(`Checking patient ${p.id}:`, {
              searchQuery,
              hn: (p as any).hn,
              hospital_number: (p as any).hospital_number,
              hnMatch,
              hospitalNumberMatch,
              hospitalNumberUpperMatch,
              finalMatch: hnMatch || hospitalNumberMatch || hospitalNumberUpperMatch
            });
            
            return hnMatch || hospitalNumberMatch || hospitalNumberUpperMatch;
          } else {
            return (p as any).national_id === searchQuery;
          }
        });
        
        console.log('Search response:', response);
        console.log('Search query:', searchQuery);
        console.log('Search type:', searchType);
        console.log('Found patients:', response.data);
        console.log('Number of patients found:', response.data.length);
        
        // Debug each patient's fields
        response.data.forEach((patient: any, index: number) => {
          console.log(`Patient ${index}:`, {
            id: patient.id,
            hn: patient.hn,
            hospital_number: patient.hospital_number,
            national_id: patient.national_id,
            thai_name: patient.thai_name,
            allFields: Object.keys(patient)
          });
        });
        
        console.log('Exact match:', exactMatch);
        
        if (exactMatch) {
          console.log('🔍 Setting selected patient:', exactMatch);
          console.log('🔍 Patient fields:', {
            hn: exactMatch.hn,
            hospital_number: exactMatch.hospital_number,
            thai_name: exactMatch.thai_name,
            first_name: exactMatch.first_name,
            last_name: exactMatch.last_name,
            gender: exactMatch.gender,
            birth_date: exactMatch.birth_date,
            birth_year: exactMatch.birth_year,
            birth_month: exactMatch.birth_month,
            birth_day: exactMatch.birth_day
          });
          setSelectedPatient(exactMatch);
          // อัปเดตเวลาปัจจุบันเมื่อเลือกผู้ป่วย
          const currentTime = createLocalDateTimeString(new Date());
          setCheckInData(prev => ({
            ...prev,
            patientHn: exactMatch.hn || exactMatch.hospital_number || '',
            patientNationalId: exactMatch.national_id || '',
            visitTime: currentTime // อัปเดตเวลาปัจจุบัน
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

  // Calendar modal functions
  const openCalendarModal = () => {
    const currentDateTime = checkInData.visitTime ? new Date(checkInData.visitTime) : new Date();
    setSelectedDate(currentDateTime);
    setSelectedTime({ 
      hours: currentDateTime.getHours(), 
      minutes: currentDateTime.getMinutes() 
    });
    setShowCalendarModal(true);
  };

  const closeCalendarModal = () => {
    setShowCalendarModal(false);
  };

  const confirmDateTime = () => {
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
    const now = new Date();
    
    // Check if the selected date and time is in the past (with 1 minute buffer)
    const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
    if (newDateTime < oneMinuteAgo) {
      setErrors(prev => ({
        ...prev,
        visitTime: "ไม่สามารถเลือกวันที่และเวลาในอดีตได้ กรุณาเลือกเวลาปัจจุบันหรืออนาคต"
      }));
      return; // Don't close modal if time is in the past
    }
    
    // Clear error if time is valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.visitTime;
      return newErrors;
    });
    
    // Create local datetime string in YYYY-MM-DDTHH:MM format
    const dateTimeString = createLocalDateTimeString(newDateTime);
    
    handleInputChange("visitTime", dateTimeString);
    setShowCalendarModal(false);
  };

  const setCurrentDateTime = () => {
    // Set to current time
    const now = new Date();
    
    // Create local datetime string in YYYY-MM-DDTHH:MM format
    const currentTimeString = createLocalDateTimeString(now);
    
    setSelectedDate(now);
    setSelectedTime({ hours: now.getHours(), minutes: now.getMinutes() });
    
    // Update form data
    setCheckInData(prev => ({
      ...prev,
      visitTime: currentTimeString
    }));
    
    // Clear any time errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.visitTime;
      return newErrors;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      
      // Check if the new month is in the past
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      
      if (selectedDateOnly < today) {
        // If month is in the past, show error and don't allow navigation
        setErrors(prev => ({
          ...prev,
          visitTime: "ไม่สามารถเลือกเดือนในอดีตได้ กรุณาเลือกเดือนปัจจุบันหรืออนาคต"
        }));
        return prev; // Return previous date
      } else {
        // Clear error if month is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.visitTime;
          return newErrors;
        });
        return newDate;
      }
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
      
      // Check if the new year is in the past
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      
      if (selectedDateOnly < today) {
        // If year is in the past, show error and don't allow navigation
        setErrors(prev => ({
          ...prev,
          visitTime: "ไม่สามารถเลือกปีในอดีตได้ กรุณาเลือกปีปัจจุบันหรืออนาคต"
        }));
        return prev; // Return previous date
      } else {
        // Clear error if year is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.visitTime;
          return newErrors;
        });
        return newDate;
      }
    });
  };

  const selectDate = (day: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(day);
      
      // Check if the selected date is in the past
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      
      if (selectedDateOnly < today) {
        // If date is in the past, show error and don't update
        setErrors(prev => ({
          ...prev,
          visitTime: "ไม่สามารถเลือกวันที่ในอดีตได้ กรุณาเลือกวันปัจจุบันหรืออนาคต"
        }));
        return prev; // Return previous date
      } else {
        // Clear error if date is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.visitTime;
          return newErrors;
        });
        return newDate;
      }
    });
  };

  const adjustTime = (type: 'hours' | 'minutes', direction: 'up' | 'down') => {
    setSelectedTime(prev => {
      const newTime = { ...prev };
      if (type === 'hours') {
        if (direction === 'up') {
          newTime.hours = (newTime.hours + 1) % 24;
        } else {
          newTime.hours = newTime.hours === 0 ? 23 : newTime.hours - 1;
        }
      } else {
        if (direction === 'up') {
          newTime.minutes = (newTime.minutes + 1) % 60;
        } else {
          newTime.minutes = newTime.minutes === 0 ? 59 : newTime.minutes - 1;
        }
      }
      
      // Check if the new time is in the past (with 1 minute buffer)
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(newTime.hours, newTime.minutes, 0, 0);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
      
      if (newDateTime < oneMinuteAgo) {
        // If time is in the past, show error and don't update
        setErrors(prev => ({
          ...prev,
          visitTime: "ไม่สามารถเลือกเวลาในอดีตได้ กรุณาเลือกเวลาปัจจุบันหรืออนาคต"
        }));
        return prev; // Return previous time
      } else {
        // Clear error if time is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.visitTime;
          return newErrors;
        });
        
        // Update the form data with the new time
        const dateTimeString = createLocalDateTimeString(newDateTime);
        
        setCheckInData(prev => ({
          ...prev,
          visitTime: dateTimeString
        }));
        
        return newTime;
      }
    });
  };

  // Handle direct time input
  const handleTimeInput = (type: 'hours' | 'minutes', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    setSelectedTime(prev => {
      const newTime = { ...prev };
      if (type === 'hours') {
        if (numValue >= 0 && numValue <= 23) {
          newTime.hours = numValue;
        }
      } else {
        if (numValue >= 0 && numValue <= 59) {
          newTime.minutes = numValue;
        }
      }
      
      // Check if the new time is in the past (with 1 minute buffer)
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(newTime.hours, newTime.minutes, 0, 0);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
      
      if (newDateTime < oneMinuteAgo) {
        // If time is in the past, show error and don't update
        setErrors(prev => ({
          ...prev,
          visitTime: "ไม่สามารถเลือกเวลาในอดีตได้ กรุณาเลือกเวลาปัจจุบันหรืออนาคต"
        }));
        return prev; // Return previous time
      } else {
        // Clear error if time is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.visitTime;
          return newErrors;
        });
        
        // Update the form data with the new time
        const dateTimeString = createLocalDateTimeString(newDateTime);
        
        setCheckInData(prev => ({
          ...prev,
          visitTime: dateTimeString
        }));
        
        return newTime;
      }
    });
  };


  const validateForm = (): boolean => {
    const newErrors: Partial<CheckInData> = {};

    if (!selectedPatient) newErrors.patientHn = "กรุณาเลือกผู้ป่วย";
    if (!checkInData.treatmentType) newErrors.treatmentType = "กรุณาเลือกประเภทการรักษา";
    if (!checkInData.assignedDoctor) newErrors.assignedDoctor = "กรุณาเลือกแพทย์ผู้ตรวจ";
    if (!checkInData.visitTime) newErrors.visitTime = "กรุณาเลือกเวลาเริ่ม visit";
    
    // Check if visit time is in the past
    if (checkInData.visitTime) {
      const visitDateTime = new Date(checkInData.visitTime);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
      
      if (visitDateTime < oneMinuteAgo) {
        newErrors.visitTime = "ไม่สามารถเลือกเวลาในอดีตได้ กรุณาเลือกเวลาปัจจุบันหรืออนาคต";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Debug selectedPatient data
      console.log('🔍 Selected Patient Data:', {
        id: selectedPatient?.id,
        hn: selectedPatient?.hn,
        hospital_number: selectedPatient?.hospitalNumber,
        fullData: selectedPatient
      });

      // Check for duplicate visit before creating
      const visitDate = new Date(checkInData.visitTime);
      const formattedDate = visitDate.toISOString().split('T')[0]; // YYYY-MM-DD format (keep UTC for API)
      
      try {
        const duplicateCheckResponse = await fetch('/api/medical/visits', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (duplicateCheckResponse.ok) {
          const visitsData = await duplicateCheckResponse.json();
          const existingVisits = visitsData.data?.visits || [];
          
          const duplicateVisit = existingVisits.find((visit: any) => 
            visit.patient_id === selectedPatient!.id &&
            visit.visit_date === formattedDate &&
            (visit.status === 'in_progress' || visit.status === 'pending' || visit.status === 'checked_in')
          );
          
          if (duplicateVisit) {
            setError(`❌ ผู้ป่วยนี้ได้เช็คอินแล้วในวันนี้\n\nหมายเลขคิวเดิม: ${duplicateVisit.visit_number}\nสถานะ: ${duplicateVisit.status}\nวันที่: ${formattedDate}`);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (duplicateError) {
        console.warn('Could not check for duplicate visits:', duplicateError);
        // Continue with creation if duplicate check fails
      }
      
      // Create visit record using VisitService
      const visitData = {
        patientId: selectedPatient!.id,
        visitType: 'walk_in', // Use valid visit type from database constraint
        visitTime: checkInData.visitTime, // Current timestamp
        chiefComplaint: checkInData.symptoms || 'ไม่ระบุอาการ',
        presentIllness: checkInData.notes,
        priority: 'normal' as const,
        attendingDoctorId: checkInData.assignedDoctor,
      };
      
      console.log('🔍 Visit Data being sent:', visitData);
      
      const response = await VisitService.createVisit(visitData as any);
      
      console.log('🔍 Visit creation response:', {
        statusCode: response.statusCode,
        data: response.data
      });
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        // Generate queue number (this would come from the API in real implementation)
        const queueNumber = `Q${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
        const selectedDoc = doctors.find(d => d.id === checkInData.assignedDoctor);
        
        // Send notification to patient
        await sendPatientNotification(selectedPatient!, queueNumber, selectedDoc!, checkInData);
        
        // Format visit time for display
        const visitDateTime = new Date(checkInData.visitTime);
        const formattedDateTime = formatToBuddhistEra(visitDateTime);
        
            // Get queue information from API response
            const queueInfo = (response.data as any)?.queueInfo;
            const currentQueue = queueInfo?.currentQueue || selectedDoc?.currentQueue || 0;
            const estimatedWaitTime = queueInfo?.estimatedWaitTime || (currentQueue * 15);
            const queuePosition = queueInfo?.queuePosition || currentQueue;

            // Calculate actual wait time based on selected time vs current time
            const currentTime = new Date();
            const timeDifference = visitDateTime.getTime() - currentTime.getTime();
            const waitMinutes = Math.max(0, Math.round(timeDifference / (1000 * 60))); // Convert to minutes
        
        setGeneratedQueueNumber(queueNumber);
        setSuccess(`เช็คอินสำเร็จ!\n\nหมายเลขคิว: ${queueNumber}\nแพทย์: ${selectedDoc?.name}\nวันที่และเวลา: ${formattedDateTime}\nคิวที่รอ: ${queuePosition} คิว\nเวลารอโดยประมาณ: ${waitMinutes} นาที\n\n✅ ระบบได้ส่งการแจ้งเตือนให้ผู้ป่วยแล้ว\n📄 PDF รายงานถูกเก็บในระบบแล้ว`);
        
        // Reload doctors data to update queue information
        await loadDoctors();
        
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
      } else if (response.statusCode === 409) {
        // Handle duplicate visit error
        const errorMessage = response.error?.message || "ผู้ป่วยนี้ได้เช็คอินแล้วในวันนี้";
        const existingVisit = (response.error as any)?.existingVisit;
        setError(`❌ ${errorMessage}${existingVisit ? `\n\nหมายเลขคิวเดิม: ${existingVisit.visit_number}\nสถานะ: ${existingVisit.status}\nวันที่: ${existingVisit.visit_date}` : ''}`);
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

  const calculateAge = (patient: any): number => {
    console.log('🔍 Calculating age for patient:', {
      id: patient.id,
      birth_date: patient.birth_date,
      birth_year: patient.birth_year,
      birth_month: patient.birth_month,
      birth_day: patient.birth_day,
      age: patient.age,
      allFields: Object.keys(patient)
    });
    
    // Try to calculate from birth_date first
    if (patient.birth_date) {
      const today = new Date();
      const birth = new Date(patient.birth_date);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      console.log('📅 Calculated age from birth_date:', age);
      return age;
    }
    
    // Calculate from separate birth fields (Buddhist Era)
    if (patient.birth_year && patient.birth_month && patient.birth_day) {
      const today = new Date();
      // Convert Buddhist Era to Christian Era
      const christianYear = patient.birth_year - 543;
      const birth = new Date(christianYear, patient.birth_month - 1, patient.birth_day);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      console.log('📅 Calculated age from separate fields:', age, 'Buddhist year:', patient.birth_year, 'Christian year:', christianYear);
      return age;
    }
    
    // If patient already has age calculated, use it
    if (patient.age && patient.age > 0) {
      console.log('📅 Using existing age:', patient.age);
      return patient.age;
    }
    
    console.log('❌ No birth date information available, returning 0');
    return 0; // Return 0 if no birth date information
  };

  const getAvailableDoctors = () => {
    // Return all doctors for now, can add filtering logic later
    console.log('🔍 getAvailableDoctors called, doctors count:', doctors.length);
    console.log('🔍 doctors data:', doctors);
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
      visitTime: createLocalDateTimeString(new Date()), // Reset to current time
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
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
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
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.hn || selectedPatient.hospital_number || selectedPatient.hospitalNumber}</span>
                </div>
                <div>
                  <span className="text-slate-600">ชื่อ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.thai_name || selectedPatient.thaiName || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}</span>
                </div>
                <div>
                  <span className="text-slate-600">อายุ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient ? calculateAge(selectedPatient) : 'ไม่ระบุ'} ปี</span>
                </div>
                <div>
                  <span className="text-slate-600">เพศ:</span>
                  <span className="ml-2 font-medium text-slate-800">{selectedPatient.gender === 'male' ? 'ชาย' : selectedPatient.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}</span>
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
                        ผู้สร้างคิว: {user.thaiFirstName && user.thaiLastName ? 
                          `${user.thaiFirstName} ${user.thaiLastName}` : 
                          `${user.firstName} ${user.lastName}`}
                      </p>
                      <p className="text-xs text-blue-600">
                        {user.position || 
                         (user.role === 'doctor' ? 'แพทย์' : 
                          user.role === 'nurse' ? 'พยาบาล' : 
                          user.role === 'staff' ? 'เจ้าหน้าที่' : 
                          user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน')} 
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
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔍 Auth status:', { isAuthenticated, user: !!user });
                        console.log('🔍 User data:', user);
                      }}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      ตรวจสอบ Auth
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔄 Manual load doctors button clicked');
                        loadDoctors();
                      }}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      โหลดข้อมูลแพทย์
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(() => {
                    const availableDoctors = getAvailableDoctors();
                    console.log('🔍 Rendering doctors section, count:', availableDoctors.length);
                    return availableDoctors.length > 0;
                  })() ? (
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
                        <p className="text-xs text-gray-400 mt-2">Debug: Doctors count = {getAvailableDoctors().length}</p>
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
                      <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        🔄 อัปเดตอัตโนมัติ
                      </span>
                    </label>
                    
                    {/* Input field with calendar icon - like in image 2 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={checkInData.visitTime ? 
                          formatToBuddhistEra(new Date(checkInData.visitTime)) : 
                          ''
                        }
                        readOnly
                        onClick={openCalendarModal}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg cursor-pointer focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          errors.visitTime ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="YYYY-MM-DD hh:mm"
                      />
                      <button
                        type="button"
                        onClick={openCalendarModal}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
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

      {/* Calendar Modal - Compact Layout */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-full max-w-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                เลือกวันที่และเวลา
              </h3>
              <button
                onClick={closeCalendarModal}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-4">
              {/* Date Picker - Left Side */}
              <div className="flex-1">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-2 p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <button
                    onClick={() => navigateYear('prev')}
                    className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-slate-800">{selectedDate.getFullYear()}</span>
                  <button
                    onClick={() => navigateYear('next')}
                    className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3 p-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedDate.toLocaleDateString('th-TH', { month: 'long' })}
                  </span>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-2">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-600 p-1 bg-slate-100 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                    <button
                      key={day}
                      onClick={() => selectDate(day)}
                      className={`p-2 text-xs rounded-lg transition-all duration-200 hover:scale-110 ${
                        selectedDate.getDate() === day
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Picker - Right Side - Compact Layout */}
              <div className="flex-1">
                <div className="text-center mb-3">
                  <div className="text-2xl font-mono bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    {String(selectedTime.hours).padStart(2, '0')}:{String(selectedTime.minutes).padStart(2, '0')}
                  </div>
                </div>
                
                {/* Compact Time Controls */}
                <div className="flex justify-center items-center gap-4">
                  {/* Hours - Compact */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-semibold text-slate-600 mb-2 bg-slate-100 rounded py-1 px-2">ชั่วโมง</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustTime('hours', 'down')}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="text-xl font-bold text-slate-800 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg py-2 px-3 w-12 text-center shadow-sm">
                        {String(selectedTime.hours).padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('hours', 'up')}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="text-2xl font-bold text-slate-400 mt-6">:</div>

                  {/* Minutes - Compact */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-semibold text-slate-600 mb-2 bg-slate-100 rounded py-1 px-2">นาที</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustTime('minutes', 'down')}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="text-xl font-bold text-slate-800 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg py-2 px-3 w-12 text-center shadow-sm">
                        {String(selectedTime.minutes).padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('minutes', 'up')}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50">
              <button
                onClick={setCurrentDateTime}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all duration-200 hover:scale-105"
              >
                📅 วันนี้
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={closeCalendarModal}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 rounded-lg hover:from-slate-200 hover:to-gray-200 transition-all duration-200 hover:scale-105"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDateTime}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-blue-500/25"
                >
                  ✅ ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
