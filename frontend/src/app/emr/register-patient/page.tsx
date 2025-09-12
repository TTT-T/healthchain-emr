"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, User, Phone, MapPin, Heart, Shield, Save, RotateCcw, CheckCircle, AlertCircle, Search, AlertTriangle } from 'lucide-react';
import { PatientService } from '@/services/patientService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { CreatePatientRequest } from '@/types/api';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import { createLocalDateTimeString, formatLocalDateTime, formatLocalTime } from '@/utils/timeUtils';

interface PatientData {
  // ข้อมูลชื่อ-นามสกุล (5 ฟิลด์)
  title: string;
  thaiFirstName: string;
  thaiLastName: string;
  englishFirstName: string;
  englishLastName: string;
  
  // ข้อมูลส่วนตัว
  nationalId: string;
  birthDate: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  
  // ที่อยู่
  address: string;
  
  // ข้อมูลสุขภาพ
  allergies: string;
  drugAllergies: string;
  foodAllergies: string;
  environmentAllergies: string;
  medicalHistory: string;
  chronicDiseases: string;
  currentMedications: string;
  
  // ข้อมูลร่างกาย
  weight: string;
  height: string;
  
  // ข้อมูลเพิ่มเติม
  occupation: string;
  education: string;
  maritalStatus: string;
  religion: string;
  race: string;
  
  // ข้อมูลประกัน
  insuranceType: string;
  insuranceNumber: string;
  insuranceExpiryDate: string;
  insuranceExpiryDay: string;
  insuranceExpiryMonth: string;
  insuranceExpiryYear: string;
  
  // ข้อมูลติดต่อฉุกเฉิน
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export default function RegisterPatient() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<PatientData>({
    // ข้อมูลชื่อ-นามสกุล
    title: "",
    thaiFirstName: "",
    thaiLastName: "",
    englishFirstName: "",
    englishLastName: "",
    
    // ข้อมูลส่วนตัว
    nationalId: "",
    birthDate: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    gender: "",
    bloodType: "",
    phone: "",
    email: "",
    
    // ที่อยู่
    address: "",
    
    // ข้อมูลสุขภาพ
    allergies: "",
    drugAllergies: "",
    foodAllergies: "",
    environmentAllergies: "",
    medicalHistory: "",
    chronicDiseases: "",
    currentMedications: "",
    
    // ข้อมูลร่างกาย
    weight: "",
    height: "",
    
    // ข้อมูลเพิ่มเติม
    occupation: "",
    education: "",
    maritalStatus: "",
    religion: "",
    race: "",
    
    // ข้อมูลประกัน
    insuranceType: "",
    insuranceNumber: "",
    insuranceExpiryDate: "",
    insuranceExpiryDay: "",
    insuranceExpiryMonth: "",
    insuranceExpiryYear: "",
    
    // ข้อมูลติดต่อฉุกเฉิน
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });

  const [errors, setErrors] = useState<Partial<PatientData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [nationalIdStatus, setNationalIdStatus] = useState<'available' | 'taken' | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successData, setSuccessData] = useState<{hn: string, patientName: string} | null>(null);

  // Load user data from sessionStorage if available
  useEffect(() => {
    const userData = sessionStorage.getItem('selectedUserForPatientRegistration');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setSelectedUserData(parsedData);
        
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          thaiFirstName: parsedData.thaiFirstName || parsedData.firstName || "",
          thaiLastName: parsedData.thaiLastName || parsedData.lastName || "",
          englishFirstName: parsedData.englishFirstName || parsedData.firstName || "",
          englishLastName: parsedData.englishLastName || parsedData.lastName || "",
          nationalId: parsedData.nationalId || "",
          phone: parsedData.phone || "",
          email: parsedData.email || "",
          gender: parsedData.gender || "",
          birthDate: parsedData.birthDate ? parsedData.birthDate.split('T')[0] : "",
          address: parsedData.address || ""
        }));
        
        // Clear sessionStorage
        sessionStorage.removeItem('selectedUserForPatientRegistration');
      } catch (error) {
        logger.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Auto-close notification after 10 seconds
  useEffect(() => {
    if (showSuccessNotification) {
      const timer = setTimeout(() => {
        handleCloseSuccessNotification();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">กรุณาเข้าสู่ระบบ</h2>
            <p className="text-gray-600 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเข้าถึงหน้านี้ได้</p>
            <Link 
              href="/doctor/login" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientData> = {};

    // ข้อมูลส่วนตัว
    if (!formData.thaiFirstName.trim()) newErrors.thaiFirstName = "กรุณากรอกชื่อภาษาไทย";
    if (!formData.thaiLastName.trim()) newErrors.thaiLastName = "กรุณากรอกนามสกุลภาษาไทย";
    if (!formData.englishFirstName.trim()) newErrors.englishFirstName = "กรุณากรอกชื่อภาษาอังกฤษ";
    if (!formData.englishLastName.trim()) newErrors.englishLastName = "กรุณากรอกนามสกุลภาษาอังกฤษ";
    if (!formData.gender) newErrors.gender = "กรุณาเลือกเพศ";
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      newErrors.birthDate = "กรุณาเลือกวันเกิด";
    }
    if (!formData.nationalId.trim()) newErrors.nationalId = "กรุณากรอกเลขบัตรประชาชน";
    else if (!/^\d{13}$/.test(formData.nationalId)) newErrors.nationalId = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
    else if (nationalIdStatus === 'taken') newErrors.nationalId = "เลขบัตรประชาชนนี้ลงทะเบียนในระบบ EMR ไปแล้ว";
    
    // ข้อมูลติดต่อ
    if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    // Address validation removed as we only have one address field now
    
    // ข้อมูลเพิ่มเติม
    if (!formData.religion) newErrors.religion = "กรุณาเลือกศาสนา";
    
    // ข้อมูลสุขภาพ
    // Blood type validation removed as it's optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Check national ID availability when national ID is entered
    if (field === 'nationalId' && typeof value === 'string' && value.length === 13) {
      checkNationalIdAvailability(value);
    } else if (field === 'nationalId' && typeof value === 'string' && value.length !== 13) {
      setNationalIdStatus(null);
    }
  };

  /**
   * ค้นหาผู้ใช้ในระบบ
   */
  const searchUsers = async () => {
    if (!searchId.trim()) {
      alert('กรุณากรอกเลขบัตรประชาชนหรือชื่อ');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setShowSearchResults(false);

    try {
      // ค้นหาผู้ใช้ใน users table โดยใช้ national_id parameter
      const usersData = await apiClient.get(`/medical/users/search?national_id=${encodeURIComponent(searchId)}`);

      if (usersData.data && Array.isArray(usersData.data) && usersData.data.length > 0) {
        const results = usersData.data;
        const isExistingPatient = (usersData.meta as any)?.isExistingPatient || false;
        
        
        // แปลงข้อมูลให้ตรงกับ format ที่ต้องการ
        const formattedResults = results.map((item: any) => {
          // สร้าง birthDate จาก birth_day, birth_month, birth_year หรือ birth_date
          let birthDate = null;
          if (item.birth_date) {
            birthDate = item.birth_date;
          } else if (item.birth_day && item.birth_month && item.birth_year) {
            // เก็บปีเป็น พ.ศ. ไว้สำหรับการแสดงผล
            birthDate = `${item.birth_year}-${String(item.birth_month).padStart(2, '0')}-${String(item.birth_day).padStart(2, '0')}`;
          }
          

          // สร้าง title จาก gender
          let title = item.title || "";
          if (!title && item.gender) {
            title = item.gender === 'male' ? 'นาย' : item.gender === 'female' ? 'นางสาว' : '';
          }

          return {
            id: item.id,
            username: item.username,
            firstName: item.first_name,
            lastName: item.last_name,
            thaiFirstName: item.thai_name || item.thai_first_name,
            thaiLastName: item.thai_last_name,
            nationalId: item.national_id,
            email: item.email,
            phone: item.phone,
            gender: item.gender,
            title: title,
            birthDate: birthDate,
            address: item.address || item.current_address,
            bloodType: item.blood_type,
            allergies: item.allergies,
            medicalHistory: item.medical_history,
            currentMedications: item.current_medications,
            chronicDiseases: item.chronic_diseases,
            emergencyContactName: item.emergency_contact_name,
            emergencyContactPhone: item.emergency_contact_phone,
            emergencyContactRelation: item.emergency_contact_relation,
            insuranceType: item.insurance_type,
            insuranceNumber: item.insurance_number,
            insuranceExpiryDate: item.insurance_expiry_date,
            nationality: item.nationality,
            province: item.province,
            district: item.district,
            postalCode: item.postal_code,
            drugAllergies: item.drug_allergies,
            foodAllergies: item.food_allergies,
            environmentAllergies: item.environment_allergies,
            weight: item.weight,
            height: item.height,
            occupation: item.occupation,
            education: item.education,
            maritalStatus: item.marital_status,
            religion: item.religion,
            race: item.race,
            birthDay: item.birth_day,
            birthMonth: item.birth_month,
            birthYear: item.birth_year,
            hasPatientRecord: isExistingPatient,
            patientData: isExistingPatient ? {
              hospital_number: item.hospital_number,
              id: item.id
            } : null
          };
        });

        setSearchResults(formattedResults);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(true);
        alert('ไม่พบข้อมูลผู้ใช้ในระบบ');
      }
    } catch (error) {
      logger.error('Error searching users:', error);
      alert('เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * เลือกผู้ใช้สำหรับการลงทะเบียน
   */
  const selectUser = (user: any) => {
    setSelectedUserData(user);
    setSearchId('');
    setShowSearchResults(false);
    
    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      title: user.title || (user.gender === 'male' ? 'นาย' : user.gender === 'female' ? 'นางสาว' : ''),
      thaiFirstName: user.thaiFirstName || user.firstName || "",
      thaiLastName: user.thaiLastName || user.lastName || "",
      englishFirstName: user.firstName || "",
      englishLastName: user.lastName || "",
      nationalId: user.nationalId || "",
      phone: user.phone || "",
      email: user.email || "",
      gender: user.gender || "",
      birthDate: user.birthDate ? user.birthDate.split('T')[0] : "",
      birthDay: user.birthDay || "",
      birthMonth: user.birthMonth || "",
      birthYear: user.birthYear || "",
      address: user.address || "",
      bloodType: user.bloodType || "",
      allergies: user.allergies || "",
      medicalHistory: user.medicalHistory || "",
      currentMedications: user.currentMedications || "",
      chronicDiseases: user.chronicDiseases || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
      emergencyContactRelation: user.emergencyContactRelation || "",
      insuranceType: user.insuranceType || "",
      insuranceNumber: user.insuranceNumber || "",
      insuranceExpiryDate: user.insuranceExpiryDate ? user.insuranceExpiryDate.split('T')[0] : "",
      nationality: user.nationality || "",
      province: user.province || "",
      district: user.district || "",
      postalCode: user.postalCode || "",
      drugAllergies: user.drugAllergies || "",
      foodAllergies: user.foodAllergies || "",
      environmentAllergies: user.environmentAllergies || "",
      weight: user.weight || "",
      height: user.height || "",
      occupation: user.occupation || "",
      education: user.education || "",
      maritalStatus: user.maritalStatus || "",
      religion: user.religion || "",
      race: user.race || ""
    }));

    // ตรวจสอบเลขบัตรประชาชนซ้ำกัน
    if (user.nationalId) {
      checkNationalIdAvailability(user.nationalId);
    }
  };

  /**
   * ตรวจสอบว่าเลขบัตรประชาชนซ้ำกันหรือไม่
   */
  const checkNationalIdAvailability = async (nationalId: string) => {
    if (!nationalId || nationalId.length !== 13) {
      setNationalIdStatus(null);
      return;
    }

    setIsCheckingNationalId(true);
    setNationalIdStatus(null);

    try {
      // ตรวจสอบในตาราง users
      const usersData = await apiClient.get(`/medical/users/search?national_id=${nationalId}`);

      if (usersData.data && Array.isArray(usersData.data) && usersData.data.length > 0) {
        const isExistingPatient = (usersData.meta as any)?.isExistingPatient || false;
        
        if (isExistingPatient) {
          setNationalIdStatus('taken');
          setErrors(prev => ({ 
            ...prev, 
            nationalId: 'เลขบัตรประชาชนนี้ลงทะเบียนในระบบ EMR ไปแล้ว' 
          }));
        } else {
          setNationalIdStatus('available');
        }
      } else {
        setNationalIdStatus('available');
      }
    } catch (error) {
      logger.error('Error checking national ID availability:', error);
      setNationalIdStatus(null);
    } finally {
      setIsCheckingNationalId(false);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      alert("กรุณากรอกเลขบัตรประชาชน");
      return;
    }

    if (!/^\d{13}$/.test(searchId)) {
      alert("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
      return;
    }

    setIsSearching(true);
    try {
      // ค้นหาผู้ป่วยจาก API
      const response = await PatientService.searchPatients(searchId, 'name');
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        const user = response.data[0];
        const isExistingPatient = (response.meta as any)?.isExistingPatient;
        
        if (isExistingPatient) {
          // ผู้ป่วยมีอยู่แล้วในตาราง patients
          setSearchResult({ ...user, isExistingPatient: true });
          setFormData(prev => ({ ...prev, nationalId: searchId }));
        } else {
          // ผู้ใช้มีอยู่แล้วในตาราง users แต่ยังไม่ได้ลงทะเบียนเป็นผู้ป่วย
          setSearchResult({ ...user, isExistingPatient: false });
          setFormData(prev => ({ ...prev, nationalId: searchId }));
        }
      } else {
        setSearchResult(null);
        setFormData(prev => ({ ...prev, nationalId: searchId }));
        alert("ไม่พบข้อมูลในระบบ กรุณากรอกข้อมูลผู้ป่วยใหม่");
      }
      
    } catch (error) {
      logger.error("Error searching:", error);
      alert("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadUserData = () => {
    if (!searchResult) return;

    // Map ข้อมูลจาก API response กลับมาเป็น form format
    const birthDate = searchResult.birth_date || "";
    const birthDateObj = birthDate ? new Date(birthDate) : new Date();
    
    const mappedData: PatientData = {
      // ข้อมูลชื่อ-นามสกุล
      title: searchResult.title || (searchResult.gender === 'male' ? 'นาย' : searchResult.gender === 'female' ? 'นางสาว' : ''),
      thaiFirstName: searchResult.thai_name || "",
      thaiLastName: searchResult.thai_last_name || "",
      englishFirstName: searchResult.first_name || "",
      englishLastName: searchResult.last_name || "",
      
      // ข้อมูลส่วนตัว
      nationalId: searchResult.national_id || searchId,
      birthDate: birthDate,
      birthDay: searchResult.birth_day?.toString() || birthDateObj.getDate().toString() || "1",
      birthMonth: searchResult.birth_month?.toString() || (birthDateObj.getMonth() + 1).toString() || "1",
      birthYear: searchResult.birth_year?.toString() || (birthDateObj.getFullYear() + 543).toString() || "2540",
      gender: searchResult.gender || "",
      bloodType: searchResult.blood_type || "",
      phone: searchResult.phone || "",
      email: searchResult.email || "",
      
      // ที่อยู่
      address: searchResult.address || "",
      
      // ข้อมูลสุขภาพ
      allergies: searchResult.allergies || "",
      drugAllergies: searchResult.drug_allergies || "",
      foodAllergies: searchResult.food_allergies || "",
      environmentAllergies: searchResult.environment_allergies || "",
      medicalHistory: searchResult.medical_history || "",
      chronicDiseases: searchResult.chronic_diseases || "",
      currentMedications: searchResult.current_medications || "",
      
      // ข้อมูลร่างกาย
      weight: searchResult.weight?.toString() || "",
      height: searchResult.height?.toString() || "",
      
      // ข้อมูลเพิ่มเติม
      occupation: searchResult.occupation || "",
      education: searchResult.education || "",
      maritalStatus: searchResult.marital_status || "",
      religion: searchResult.religion || "",
      race: searchResult.race || "",
      
      // ข้อมูลประกัน
      insuranceType: searchResult.insurance_type || "",
      insuranceNumber: searchResult.insurance_number || "",
      insuranceExpiryDate: searchResult.insurance_expiry_date || "",
      insuranceExpiryDay: searchResult.insurance_expiry_day?.toString() || "",
      insuranceExpiryMonth: searchResult.insurance_expiry_month?.toString() || "",
      insuranceExpiryYear: searchResult.insurance_expiry_year?.toString() || "",
      
      // ข้อมูลติดต่อฉุกเฉิน
      emergencyContactName: searchResult.emergency_contact_name || "",
      emergencyContactPhone: searchResult.emergency_contact_phone || "",
      emergencyContactRelation: searchResult.emergency_contact_relation || ""
    };
    
    setFormData(mappedData);
    setErrors({});
  };

  const handleClearForm = () => {
    setFormData({
      // ข้อมูลชื่อ-นามสกุล
      title: "",
      thaiFirstName: "",
      thaiLastName: "",
      englishFirstName: "",
      englishLastName: "",
      
      // ข้อมูลส่วนตัว
      nationalId: "",
      birthDate: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      gender: "",
      bloodType: "",
      phone: "",
      email: "",
      
      // ที่อยู่
      address: "",
      
      // ข้อมูลสุขภาพ
      allergies: "",
      drugAllergies: "",
      foodAllergies: "",
      environmentAllergies: "",
      medicalHistory: "",
      chronicDiseases: "",
      currentMedications: "",
      
      // ข้อมูลร่างกาย
      weight: "",
      height: "",
      
      // ข้อมูลเพิ่มเติม
      occupation: "",
      education: "",
      maritalStatus: "",
      religion: "",
      race: "",
      
      // ข้อมูลประกัน
      insuranceType: "",
      insuranceNumber: "",
      insuranceExpiryDate: "",
      insuranceExpiryDay: "",
      insuranceExpiryMonth: "",
      insuranceExpiryYear: "",
      
      // ข้อมูลติดต่อฉุกเฉิน
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: ""
    });
    setSearchId("");
    setSearchResult(null);
    setErrors({});
    setNationalIdStatus(null);
  };

  const handleCloseSuccessNotification = () => {
    setShowSuccessNotification(false);
    setSuccessData(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check if national ID is already taken
    if (nationalIdStatus === 'taken') {
      alert('เลขบัตรประชาชนนี้ลงทะเบียนในระบบ EMR ไปแล้ว');
      return;
    }
    
    // ตรวจสอบว่าผู้ป่วยมีการลงทะเบียนแล้วหรือไม่
    if (searchResult && searchResult.isExistingPatient) {
      alert("ไม่สามารถลงทะเบียนได้ เนื่องจากผู้ป่วยนี้มีการลงทะเบียนแล้วในระบบ");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // แปลงวันเกิดจาก Buddhist Era เป็น Christian Era
      const christianYear = parseInt(formData.birthYear) - 543;
      const birthDate = `${christianYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      
      // ตรวจสอบว่ามี user ID หรือไม่
      if (!selectedUserData?.id) {
        logger.error('Selected user data:', selectedUserData);
        throw new Error('ไม่พบข้อมูลผู้ใช้ที่เลือก กรุณาเลือกผู้ใช้ใหม่');
      }
      
      logger.debug('Using selected user ID:', selectedUserData.id);
      
      // เตรียมข้อมูลสำหรับ API - ใช้ format ที่ backend ต้องการ
      const patientData = {
        // Required fields for backend schema
        userId: selectedUserData.id, // Get from selected user data
        firstName: formData.englishFirstName,
        lastName: formData.englishLastName,
        dateOfBirth: birthDate,
        gender: formData.gender,
        nationalId: formData.nationalId,
        
        // Optional fields
        title: formData.title,
        thaiFirstName: formData.thaiFirstName,
        thaiLastName: formData.thaiLastName,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        currentAddress: formData.address || undefined,
        bloodType: formData.bloodType || undefined,
        weight: parseFloat(formData.weight) || undefined,
        height: parseFloat(formData.height) || undefined,
        medicalHistory: formData.medicalHistory || undefined,
        allergies: formData.allergies || undefined,
        drugAllergies: formData.drugAllergies || undefined,
        foodAllergies: formData.foodAllergies || undefined,
        environmentAllergies: formData.environmentAllergies || undefined,
        chronicDiseases: formData.chronicDiseases || undefined,
        currentMedications: formData.currentMedications || undefined,
        insuranceType: formData.insuranceType || undefined,
        insuranceNumber: formData.insuranceNumber || undefined,
        insuranceExpiryDate: formData.insuranceExpiryDate || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        emergencyContactRelation: formData.emergencyContactRelation || undefined,
        religion: formData.religion || undefined,
        race: formData.race || undefined,
        occupation: formData.occupation || undefined,
        education: formData.education || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        isActive: true
      };

      // เรียก API ใหม่ - ใช้ patient registration API
      const responseData = await apiClient.post('/patient-registration/register', patientData);
      
      // Backend ส่งกลับ response format: { data: { patient: {...} }, statusCode: 201 }
      if (responseData && (responseData as any).data && (responseData as any).data.patient) {
        const patient = (responseData as any).data.patient;
        
        // แสดงการแจ้งเตือนที่สวยงาม
        setSuccessData({
          hn: patient.hospitalNumber,
          patientName: `${formData.thaiFirstName} ${formData.thaiLastName}`
        });
        setShowSuccessNotification(true);
        
        // ส่งการแจ้งเตือนให้ผู้ป่วย
        await sendPatientNotification(patient);
        
        // ล้างฟอร์ม
        handleClearForm();
        
        // อาจจะ redirect หรือแสดงข้อมูลผู้ป่วยที่สร้างใหม่
        logger.debug('Patient created successfully:', patient);
      } else {
        throw new Error('การลงทะเบียนไม่สำเร็จ');
      }
      
    } catch (error: any) {
      logger.error("Error submitting:", error);
      
      // Handle specific error cases
      if (error?.response?.status === 409 && error?.response?.data?.message?.includes('เลขบัตรประชาชน')) {
        setNationalIdStatus('taken');
        setErrors(prev => ({ 
          ...prev, 
          nationalId: error.response.data.message 
        }));
        alert(error.response.data.message);
      } else {
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วยเมื่อลงทะเบียนสำเร็จ
   */
  const sendPatientNotification = async (patient: any) => {
    try {
      // สร้างข้อมูลการแจ้งเตือน
      const notificationData = {
        patientHn: patient.hn || patient.hospital_number || '',
        patientNationalId: patient.national_id || formData.nationalId || '',
        patientName: patient.thai_name || `${formData.thaiFirstName} ${formData.thaiLastName}` || '',
        patientPhone: patient.phone || formData.phone || '',
        patientEmail: patient.email || formData.email || '',
        recordType: 'patient_registration',
        recordId: patient.id || patient.hn || '',
        recordTitle: 'ลงทะเบียนผู้ป่วยใหม่',
        recordDescription: `ยินดีต้อนรับ! คุณได้ลงทะเบียนเป็นผู้ป่วยของโรงพยาบาลเรียบร้อยแล้ว หมายเลข HN: ${patient.hn || patient.hospital_number}`,
        recordDetails: {
          hospitalNumber: patient.hn || patient.hospital_number,
          patientName: patient.thai_name || `${formData.thaiFirstName} ${formData.thaiLastName}`,
          registrationDate: formatLocalDateTime(new Date()),
          nextSteps: 'คุณสามารถใช้หมายเลข HN นี้เพื่อเช็คอินและรับบริการทางการแพทย์'
        },
        createdBy: user?.id || '',
        createdByName: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่',
        createdAt: createLocalDateTimeString(new Date()),
        recordedBy: user?.id || '',
        recordedTime: createLocalDateTimeString(new Date()),
        message: `ยินดีต้อนรับ! คุณได้ลงทะเบียนเป็นผู้ป่วยของโรงพยาบาลเรียบร้อยแล้ว หมายเลข HN: ${patient.hn || patient.hospital_number}`,
        severity: 'info'
      };

      // ส่งการแจ้งเตือนผ่าน NotificationService
      await NotificationService.notifyPatientRecordUpdate(notificationData);
      
      // สร้างเอกสารให้ผู้ป่วย
      await createPatientDocument(patient);
      
      logger.info('Patient notification sent successfully for registration', { 
        patientHn: notificationData.patientHn,
        recordType: 'patient_registration'
      });
    } catch (error) {
      logger.error('Error sending patient notification for registration:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการลงทะเบียนผู้ป่วย
    }
  };

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'patient_registration',
        {
          hospitalNumber: patient.hn || patient.hospital_number,
          patientName: patient.thai_name || `${formData.thaiFirstName} ${formData.thaiLastName}`,
          registrationDate: createLocalDateTimeString(new Date()),
          personalInfo: {
            thaiName: patient.thai_name || `${formData.thaiFirstName} ${formData.thaiLastName}`,
            englishName: patient.english_name || `${formData.englishFirstName} ${formData.englishLastName}`,
            gender: patient.gender || formData.gender,
            birthDate: patient.birth_date || formData.birthDate,
            nationalId: patient.national_id || formData.nationalId,
            phone: patient.phone || formData.phone,
            email: patient.email || formData.email
          }
        },
        {
          patientHn: patient.hn || patient.hospital_number || '',
          patientNationalId: patient.national_id || formData.nationalId || '',
          patientName: patient.thai_name || `${formData.thaiFirstName} ${formData.thaiLastName}` || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for registration', { 
        patientHn: patient.hn || patient.hospital_number,
        recordType: 'patient_registration'
      });
    } catch (error) {
      logger.error('Error creating patient document for registration:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการลงทะเบียนผู้ป่วย
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Success Notification Modal */}
      {showSuccessNotification && successData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">ลงทะเบียนสำเร็จ!</h3>
                  <p className="text-green-100 text-sm">ยินดีต้อนรับสู่ระบบ EMR</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <div className="text-2xl font-bold text-blue-600 mb-2">หมายเลข HN</div>
                  <div className="text-3xl font-black text-blue-800 tracking-wider">
                    {successData.hn}
                  </div>
                </div>
                
                <div className="text-gray-600 mb-4">
                  <p className="font-medium text-gray-800">ผู้ป่วย: {successData.patientName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    วันที่ลงทะเบียน: {formatLocalDateTime(new Date())}
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <AlertCircle size={20} className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">หมายเหตุสำคัญ:</p>
                      <p>กรุณาจดจำหมายเลข HN นี้ไว้เพื่อใช้ในการรับบริการทางการแพทย์</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseSuccessNotification}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  เข้าใจแล้ว
                </button>
                <button
                  onClick={() => {
                    handleCloseSuccessNotification();
                    // Scroll to top of form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  ลงทะเบียนใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/emr"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                กลับ
              </Link>
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ลงทะเบียนผู้ป่วยใหม่</h1>
                <p className="text-gray-600">ลงทะเบียนผู้ป่วยใหม่เข้าสู่ระบบ EMR</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/emr/user-search"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Search className="w-4 h-4 mr-2" />
                ค้นหาผู้ใช้
              </Link>
            </div>
          </div>
        </div>

        {/* Selected User Info */}
        {selectedUserData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  ข้อมูลผู้ใช้ที่เลือก
                </h3>
                <p className="text-green-700">
                  {selectedUserData.firstName} {selectedUserData.lastName} 
                  {selectedUserData.email && ` (${selectedUserData.email})`}
                </p>
                <p className="text-sm text-green-600">
                  ข้อมูลจากระบบสมัครสมาชิกได้ถูกนำมาเติมในฟอร์มแล้ว
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ค้นหาข้อมูลผู้ป่วย
            </h2>
            <p className="text-gray-600">ค้นหาด้วยเลขบัตรประชาชนเพื่อตรวจสอบข้อมูลเดิม หรือลงทะเบียนใหม่</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขบัตรประชาชน
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                maxLength={13}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1234567890123"
                disabled={isSearching}
              />
            </div>
            <div className="flex gap-2 sm:items-end">
              <button
                onClick={searchUsers}
                disabled={isSearching || !searchId.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSearching || !searchId.trim()
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
              
              <button
                onClick={handleClearForm}
                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ล้างข้อมูล
                </div>
              </button>
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mt-4">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">ผลการค้นหา</h3>
                  {searchResults.map((user, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${
                      user.hasPatientRecord 
                ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                          <svg className={`w-5 h-5 mr-2 ${user.hasPatientRecord ? 'text-red-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            {user.hasPatientRecord ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                          <span className={`font-medium ${user.hasPatientRecord ? 'text-red-800' : 'text-green-800'}`}>
                            {user.hasPatientRecord ? 'ผู้ป่วยมีการลงทะเบียนแล้ว' : 'พบข้อมูลผู้ใช้ในระบบ'}
                  </span>
                </div>
                        {!user.hasPatientRecord && (
                  <button
                            onClick={() => selectUser(user)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                            เลือกผู้ใช้
                  </button>
                )}
              </div>
                      <div className={`mt-2 text-sm ${user.hasPatientRecord ? 'text-red-700' : 'text-green-700'} space-y-1`}>
                        <p><strong>คำนำหน้าชื่อ:</strong> {user.title || (user.gender === 'male' ? 'นาย' : user.gender === 'female' ? 'นางสาว' : 'ไม่ระบุ')}</p>
                        <p><strong>ชื่อไทย:</strong> {user.thaiFirstName || 'ไม่ระบุ'} {user.thaiLastName || ''}</p>
                        <p><strong>ชื่ออังกฤษ:</strong> {user.firstName || 'ไม่ระบุ'} {user.lastName || 'ไม่ระบุ'}</p>
                        <p><strong>เพศ:</strong> {user.gender === 'male' ? 'ชาย' : user.gender === 'female' ? 'หญิง' : user.gender || 'ไม่ระบุ'}</p>
                        <p><strong>อีเมล:</strong> {user.email || 'ไม่ระบุ'}</p>
                        <p><strong>โทรศัพท์:</strong> {user.phone || 'ไม่ระบุ'}</p>
                        <p><strong>เลขบัตรประชาชน:</strong> {user.nationalId || 'ไม่ระบุ'}</p>
                    <p><strong>วันเกิด:</strong> {
                      user.birthDate ? 
                        (() => {
                          // ถ้า birthDate เป็นรูปแบบ YYYY-MM-DD และปีเป็น พ.ศ.
                          if (user.birthDate.includes('-')) {
                            const [year, month, day] = user.birthDate.split('-');
                            return `${day}/${month}/${year}`;
                          }
                          return new Date(user.birthDate).toLocaleDateString('th-TH');
                        })() : 
                      (user.birthDay && user.birthMonth && user.birthYear) ? 
                        `${user.birthDay}/${user.birthMonth}/${user.birthYear}` : 
                        'ไม่ระบุ'
                    }</p>
                    <p><strong>ประเภทประกัน:</strong> {user.insuranceType || 'ไม่ระบุ'}</p>
                        <p><strong>ที่อยู่:</strong> {user.address || 'ไม่ระบุ'}</p>
                        <p><strong>หมู่เลือด:</strong> {user.bloodType || 'ไม่ระบุ'}</p>
                        <p><strong>ศาสนา:</strong> {user.religion || 'ไม่ระบุ'}</p>
                        <p><strong>เชื้อชาติ:</strong> {user.race || 'ไม่ระบุ'}</p>
                        <p><strong>อาชีพ:</strong> {user.occupation || 'ไม่ระบุ'}</p>
                        <p><strong>การศึกษา:</strong> {user.education || 'ไม่ระบุ'}</p>
                        <p><strong>สถานภาพ:</strong> {user.maritalStatus || 'ไม่ระบุ'}</p>
                        {user.weight && <p><strong>น้ำหนัก:</strong> {user.weight} กก.</p>}
                        {user.height && <p><strong>ส่วนสูง:</strong> {user.height} ซม.</p>}
                        {user.allergies && <p><strong>อาการแพ้:</strong> {user.allergies}</p>}
                        {user.medicalHistory && <p><strong>ประวัติการเจ็บป่วย:</strong> {user.medicalHistory}</p>}
                        {user.currentMedications && <p><strong>ยาที่ใช้อยู่:</strong> {user.currentMedications}</p>}
                        {user.chronicDiseases && <p><strong>โรคประจำตัว:</strong> {user.chronicDiseases}</p>}
                        {user.hasPatientRecord && user.patientData && (
                          <p className="text-green-600 font-semibold"><strong>หมายเลข HN:</strong> {user.patientData.hospital_number}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-800 font-medium">ไม่พบข้อมูลผู้ใช้ในระบบ</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">กรุณาตรวจสอบเลขบัตรประชาชนหรือชื่อที่กรอก</p>
                </div>
              )}
            </div>
          )}

          {/* Selected User Info */}
          {selectedUserData && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-blue-800">ผู้ใช้ที่เลือก</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserData(null);
                    setFormData({
                      title: "",
                      thaiFirstName: "",
                      thaiLastName: "",
                      englishFirstName: "",
                      englishLastName: "",
                      nationalId: "",
                      birthDate: "",
                      birthDay: "",
                      birthMonth: "",
                      birthYear: "",
                      gender: "",
                      bloodType: "",
                      phone: "",
                      email: "",
                      address: "",
                      allergies: "",
                      drugAllergies: "",
                      foodAllergies: "",
                      environmentAllergies: "",
                      medicalHistory: "",
                      chronicDiseases: "",
                      currentMedications: "",
                      weight: "",
                      height: "",
                      occupation: "",
                      education: "",
                      maritalStatus: "",
                      religion: "",
                      race: "",
                      insuranceType: "",
                      insuranceNumber: "",
                      insuranceExpiryDate: "",
                      insuranceExpiryDay: "",
                      insuranceExpiryMonth: "",
                      insuranceExpiryYear: "",
                      emergencyContactName: "",
                      emergencyContactPhone: "",
                      emergencyContactRelation: ""
                    });
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>ชื่อ:</strong> {selectedUserData.thaiFirstName || selectedUserData.firstName} {selectedUserData.thaiLastName || selectedUserData.lastName}</p>
                <p><strong>อีเมล:</strong> {selectedUserData.email}</p>
                <p><strong>โทรศัพท์:</strong> {selectedUserData.phone}</p>
                <p><strong>เลขบัตรประชาชน:</strong> {selectedUserData.nationalId}</p>
              </div>
            </div>
          )}

        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              ข้อมูลผู้ป่วยใหม่
            </h2>
            <p className="text-slate-600">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อลงทะเบียนผู้ป่วยใหม่</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
            {/* Names Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <User size={24} className="text-blue-600" />
                </div>
            <div>
                  <h2 className="text-2xl font-bold text-gray-900">ข้อมูลชื่อ-นามสกุล</h2>
                  <p className="text-gray-600 mt-1">กรอกข้อมูลชื่อและนามสกุลทั้งภาษาไทยและอังกฤษ</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Title and Thai Names */}
              <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      ข้อมูลชื่อ-นามสกุล
                    </h3>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      คำนำหน้าชื่อ
                    </label>
                    <select
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 border-gray-300"
                    >
                      <option value="">เลือกคำนำหน้าชื่อ</option>
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="เด็กชาย">เด็กชาย</option>
                      <option value="เด็กหญิง">เด็กหญิง</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms.">Ms.</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="thaiFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="thaiFirstName"
                        name="thaiFirstName"
                      type="text"
                        value={formData.thaiFirstName}
                        onChange={(e) => handleInputChange("thaiFirstName", e.target.value)}
                        placeholder="ชื่อ"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.thaiFirstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.thaiFirstName && <p className="text-red-500 text-sm mt-1">{errors.thaiFirstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="thaiLastName" className="block text-sm font-medium text-gray-700 mb-2">
                        นามสกุล (ไทย) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="thaiLastName"
                        name="thaiLastName"
                        type="text"
                        value={formData.thaiLastName}
                        onChange={(e) => handleInputChange("thaiLastName", e.target.value)}
                        placeholder="นามสกุล"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.thaiLastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.thaiLastName && <p className="text-red-500 text-sm mt-1">{errors.thaiLastName}</p>}
                    </div>
                  </div>
                  </div>

                {/* English Names */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ชื่อภาษาอังกฤษ
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                  <div>
                      <label htmlFor="englishFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ (อังกฤษ) <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="englishFirstName"
                        name="englishFirstName"
                      type="text"
                        value={formData.englishFirstName}
                        onChange={(e) => handleInputChange("englishFirstName", e.target.value)}
                        placeholder="First Name"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.englishFirstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.englishFirstName && <p className="text-red-500 text-sm mt-1">{errors.englishFirstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="englishLastName" className="block text-sm font-medium text-gray-700 mb-2">
                        นามสกุล (อังกฤษ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="englishLastName"
                        name="englishLastName"
                        type="text"
                        value={formData.englishLastName}
                        onChange={(e) => handleInputChange("englishLastName", e.target.value)}
                        placeholder="Last Name"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.englishLastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.englishLastName && <p className="text-red-500 text-sm mt-1">{errors.englishLastName}</p>}
                    </div>
                  </div>
                </div>
                  </div>
                </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User size={20} className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
              </div>

              <div className="space-y-6">
                {/* Row 1: National ID and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                      เลขบัตรประชาชน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="nationalId"
                        name="nationalId"
                        type="text"
                        value={formData.nationalId}
                        onChange={(e) => handleInputChange("nationalId", e.target.value)}
                        placeholder="1234567890123"
                        maxLength={13}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.nationalId ? 'border-red-500 bg-red-50' : 
                          nationalIdStatus === 'taken' ? 'border-red-500 bg-red-50' :
                          nationalIdStatus === 'available' ? 'border-green-500 bg-green-50' :
                          'border-gray-300'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isCheckingNationalId && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        )}
                        {!isCheckingNationalId && nationalIdStatus === 'available' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {!isCheckingNationalId && nationalIdStatus === 'taken' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {errors.nationalId && <p className="text-red-500 text-sm mt-1">{errors.nationalId}</p>}
                    {nationalIdStatus === 'available' && !errors.nationalId && (
                      <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        เลขบัตรประชาชนนี้สามารถใช้ได้
                      </p>
                    )}
                    {nationalIdStatus === 'taken' && !errors.nationalId && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        เลขบัตรประชาชนนี้ลงทะเบียนในระบบ EMR ไปแล้ว
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      เพศ <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                  </div>
                  </div>

                {/* Row 2: Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                      วันเกิด <span className="text-red-500">*</span>
                    </label>
                  
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                      <label className="block text-xs text-gray-600 mb-1">วัน</label>
                        <select
                          value={formData.birthDay}
                        onChange={(e) => handleInputChange("birthDay", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                          errors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">เลือกวัน</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day.toString()}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                      <label className="block text-xs text-gray-600 mb-1">เดือน</label>
                        <select
                          value={formData.birthMonth}
                        onChange={(e) => handleInputChange("birthMonth", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                          errors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">เลือกเดือน</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString()}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                      <label className="block text-xs text-gray-600 mb-1">ปี (พ.ศ.)</label>
                        <select
                          value={formData.birthYear}
                        onChange={(e) => handleInputChange("birthYear", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                          errors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">เลือกปี</option>
                          {Array.from({ length: 100 }, (_, i) => 2567 - i).map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                  </div>

                {/* Row 3: Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="0812345678"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="example@email.com"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Row 4: Blood Type and Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                      หมู่เลือด
                      </label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange("bloodType", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    >
                      <option value="">เลือกหมู่เลือด</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    </div>

                    <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      ที่อยู่
                      </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="ที่อยู่ปัจจุบัน"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 resize-vertical"
                    />
                  </div>
                </div>
              </div>
                    </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart size={20} className="text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ข้อมูลสุขภาพ</h2>
              </div>

              <div className="space-y-6">
                {/* Physical Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                      น้ำหนัก (กิโลกรัม)
                      </label>
                      <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      placeholder="เช่น 65"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                    </div>

                    <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                      ส่วนสูง (เซนติเมตร)
                      </label>
                      <input
                      type="number"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      placeholder="เช่น 170"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                    </div>

                {/* Allergies */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="drugAllergies" className="block text-sm font-medium text-gray-700 mb-2">
                      การแพ้ยา
                      </label>
                    <textarea
                      id="drugAllergies"
                      name="drugAllergies"
                      value={formData.drugAllergies}
                      onChange={(e) => handleInputChange("drugAllergies", e.target.value)}
                      placeholder="ระบุการแพ้ยา เช่น แพ้ยาแอสไพริน, เพนิซิลลิน"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
            </div>

                  <div>
                    <label htmlFor="foodAllergies" className="block text-sm font-medium text-gray-700 mb-2">
                      การแพ้อาหาร
                    </label>
                    <textarea
                      id="foodAllergies"
                      name="foodAllergies"
                      value={formData.foodAllergies}
                      onChange={(e) => handleInputChange("foodAllergies", e.target.value)}
                      placeholder="ระบุการแพ้อาหาร เช่น แพ้อาหารทะเล, ถั่วลิสง"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
              </div>
              
                <div>
                    <label htmlFor="environmentAllergies" className="block text-sm font-medium text-gray-700 mb-2">
                      การแพ้สิ่งแวดล้อม
                  </label>
                    <textarea
                      id="environmentAllergies"
                      name="environmentAllergies"
                      value={formData.environmentAllergies}
                      onChange={(e) => handleInputChange("environmentAllergies", e.target.value)}
                      placeholder="ระบุการแพ้สิ่งแวดล้อม เช่น แพ้ฝุ่น, แพ้เกสรดอกไม้"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                </div>

                <div>
                    <label htmlFor="chronicDiseases" className="block text-sm font-medium text-gray-700 mb-2">
                      โรคเรื้อรัง
                  </label>
                    <textarea
                      id="chronicDiseases"
                      name="chronicDiseases"
                      value={formData.chronicDiseases}
                      onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
                      placeholder="ระบุโรคเรื้อรัง เช่น เบาหวาน, ความดันโลหิตสูง, โรคหัวใจ"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                    <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 mb-2">
                      ยาที่ใช้ประจำ
                  </label>
                    <textarea
                      id="currentMedications"
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                      placeholder="ระบุยาที่ใช้ประจำ เช่น เมตฟอร์มิน 500mg วันละ 2 ครั้ง"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield size={20} className="text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ข้อมูลประกัน</h2>
              </div>

              {/* Optional message */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">ถ้าไม่มีประกันก็ไม่ต้องใส่</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Row 1: Insurance Type and Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="insuranceType" className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทประกัน
                    </label>
                    <select
                      id="insuranceType"
                      name="insuranceType"
                      value={formData.insuranceType}
                      onChange={(e) => handleInputChange("insuranceType", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    >
                      <option value="">เลือกประเภทประกัน</option>
                      <option value="social_security">ประกันสังคม</option>
                      <option value="civil_servant">ข้าราชการ</option>
                      <option value="gold_card">บัตรทอง</option>
                      <option value="private">ประกันเอกชน</option>
                      <option value="none">ไม่มีประกัน</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      เลขที่ประกัน
                    </label>
                    <input
                      id="insuranceNumber"
                      name="insuranceNumber"
                      type="text"
                      value={formData.insuranceNumber}
                      onChange={(e) => handleInputChange("insuranceNumber", e.target.value)}
                      placeholder="เลขที่ประกัน"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
                  </div>
                </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Phone size={20} className="text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ข้อมูลติดต่อฉุกเฉิน</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อผู้ติดต่อฉุกเฉิน
                    </label>
                    <input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="0812345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700 mb-2">
                      ความสัมพันธ์
                    </label>
                    <select
                      id="emergencyContactRelation"
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => handleInputChange("emergencyContactRelation", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    >
                      <option value="">เลือกความสัมพันธ์</option>
                      <option value="spouse">คู่สมรส</option>
                      <option value="parent">บิดา/มารดา</option>
                      <option value="child">บุตร</option>
                      <option value="sibling">พี่น้อง</option>
                      <option value="relative">ญาติ</option>
                      <option value="friend">เพื่อน</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="button"
                onClick={handleClearForm}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <RotateCcw size={20} className="mr-2" />
                ล้างฟอร์ม
              </button>
              
                <button
                  type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    ลงทะเบียนผู้ป่วย
                  </>
                  )}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
