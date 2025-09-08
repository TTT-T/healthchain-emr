"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, User, Phone, MapPin, Heart, Shield, Save, RotateCcw, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { PatientService } from '@/services/patientService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { CreatePatientRequest } from '@/types/api';
import { logger } from '@/lib/logger';

interface PatientData {
  // ข้อมูลส่วนตัว
  hospitalNumber: string;
  thaiName: string;
  englishName: string;
  gender: string;
  birthDate: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  nationalId: string;
  
  // ข้อมูลติดต่อ
  phone: string;
  email: string;
  
  // ที่อยู่
  houseNumber: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  
  // ข้อมูลเพิ่มเติม
  religion: string;
  nationality: string;
  ethnicity: string;
  
  // ข้อมูลสุขภาพ
  bloodGroup: string;
  rhFactor: string;
  chronicDiseases: string;
  drugAllergies: string;
}

export default function RegisterPatient() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PatientData>({
    hospitalNumber: "",
    thaiName: "",
    englishName: "",
    gender: "",
    birthDate: "",
    birthDay: 1,
    birthMonth: 1,
    birthYear: 2540,
    nationalId: "",
    phone: "",
    email: "",
    houseNumber: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    religion: "",
    nationality: "ไทย",
    ethnicity: "ไทย",
    bloodGroup: "",
    rhFactor: "",
    chronicDiseases: "",
    drugAllergies: ""
  });

  const [errors, setErrors] = useState<Partial<PatientData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);

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
          thaiName: `${parsedData.firstName} ${parsedData.lastName}`,
          englishName: `${parsedData.firstName} ${parsedData.lastName}`,
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

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientData> = {};

    // ข้อมูลส่วนตัว
    if (!formData.thaiName.trim()) newErrors.thaiName = "กรุณากรอกชื่อภาษาไทย";
    if (!formData.gender) newErrors.gender = "กรุณาเลือกเพศ";
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      newErrors.birthDate = "กรุณาเลือกวันเกิด";
    }
    if (!formData.nationalId.trim()) newErrors.nationalId = "กรุณากรอกเลขบัตรประชาชน";
    else if (!/^\d{13}$/.test(formData.nationalId)) newErrors.nationalId = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
    
    // ข้อมูลติดต่อ
    if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!formData.houseNumber.trim()) newErrors.houseNumber = "กรุณากรอกบ้านเลขที่";
    if (!formData.subDistrict.trim()) newErrors.subDistrict = "กรุณากรอกตำบล";
    if (!formData.district.trim()) newErrors.district = "กรุณากรอกอำเภอ";
    if (!formData.province.trim()) newErrors.province = "กรุณากรอกจังหวัด";
    
    // ข้อมูลเพิ่มเติม
    if (!formData.religion) newErrors.religion = "กรุณาเลือกศาสนา";
    
    // ข้อมูลสุขภาพ
    if (!formData.bloodGroup) newErrors.bloodGroup = "กรุณาเลือกกรุ๊ปเลือด";
    if (!formData.rhFactor) newErrors.rhFactor = "กรุณาเลือก Rh Factor";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      const response = await PatientService.searchPatients(searchId, 'hn');
      
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
    const birthDate = searchResult.personal_info?.birth_date || searchResult.birth_date || "";
    const birthDateObj = birthDate ? new Date(birthDate) : new Date();
    
    const mappedData: PatientData = {
      hospitalNumber: "", // จะสร้างใหม่ใน backend
      thaiName: searchResult.personal_info?.thai_name || searchResult.thai_name || "",
      englishName: searchResult.personal_info?.first_name || searchResult.first_name || "",
      gender: searchResult.personal_info?.gender || searchResult.gender || "",
      birthDate: birthDate,
      birthDay: searchResult.birth_day || birthDateObj.getDate() || 1,
      birthMonth: searchResult.birth_month || (birthDateObj.getMonth() + 1) || 1,
      birthYear: searchResult.birth_year || (birthDateObj.getFullYear() + 543) || 2540, // Convert to Buddhist Era
      nationalId: searchResult.personal_info?.national_id || searchResult.national_id || searchId,
      phone: searchResult.contact_info?.phone || searchResult.phone || "",
      email: searchResult.contact_info?.email || searchResult.email || "",
      houseNumber: "",
      subDistrict: "",
      district: "",
      province: "",
      postalCode: "",
      religion: "",
      nationality: "ไทย",
      ethnicity: "ไทย",
      bloodGroup: searchResult.medical_info?.blood_group || (searchResult.blood_type ? searchResult.blood_type.charAt(0) : ""),
      rhFactor: searchResult.medical_info?.blood_type?.includes('+') || searchResult.blood_type?.includes('+') ? 'positive' : 'negative',
      chronicDiseases: searchResult.medical_info?.chronic_diseases || searchResult.chronic_diseases || "",
      drugAllergies: searchResult.medical_info?.drug_allergies || searchResult.drug_allergies || ""
    };
    
    setFormData(mappedData);
    setErrors({});
  };

  const handleClearForm = () => {
    setFormData({
      hospitalNumber: "",
      thaiName: "",
      englishName: "",
      gender: "",
      birthDate: "",
      birthDay: 1,
      birthMonth: 1,
      birthYear: 2540,
      nationalId: "",
      phone: "",
      email: "",
      houseNumber: "",
      subDistrict: "",
      district: "",
      province: "",
      postalCode: "",
      religion: "",
      nationality: "ไทย",
      ethnicity: "ไทย",
      bloodGroup: "",
      rhFactor: "",
      chronicDiseases: "",
      drugAllergies: ""
    });
    setSearchId("");
    setSearchResult(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // ตรวจสอบว่าผู้ป่วยมีการลงทะเบียนแล้วหรือไม่
    if (searchResult && searchResult.isExistingPatient) {
      alert("ไม่สามารถลงทะเบียนได้ เนื่องจากผู้ป่วยนี้มีการลงทะเบียนแล้วในระบบ");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // แปลงวันเกิดจาก Buddhist Era เป็น Christian Era
      const christianYear = formData.birthYear - 543;
      const birthDate = `${christianYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      
      // เตรียมข้อมูลสำหรับ API - ใช้ format ที่ backend ต้องการ
      const patientData = {
        first_name: formData.englishName || formData.thaiName,
        last_name: '', // Backend requires last_name
        thai_name: formData.thaiName,
        national_id: formData.nationalId,
        birth_date: birthDate,
        gender: formData.gender,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: `${formData.houseNumber} ${formData.subDistrict} ${formData.district} ${formData.province} ${formData.postalCode}`,
        current_address: `${formData.houseNumber} ${formData.subDistrict} ${formData.district} ${formData.province} ${formData.postalCode}`,
        blood_group: formData.bloodGroup,
        blood_type: formData.bloodGroup + (formData.rhFactor === 'positive' ? '+' : '-'),
        medical_history: formData.chronicDiseases || undefined,
        allergies: formData.drugAllergies ? formData.drugAllergies.split(',').map(a => a.trim()) : undefined,
        drug_allergies: formData.drugAllergies || undefined,
        chronic_diseases: formData.chronicDiseases || undefined,
        is_active: true
      };

      // เรียก API
      const response = await PatientService.createPatient(patientData);
      
      if (response.statusCode === 200 && response.data) {
        const patient = response.data;
        alert(`ลงทะเบียนสำเร็จ! หมายเลข HN: ${patient.hn}`);
        
        // ส่งการแจ้งเตือนให้ผู้ป่วย
        await sendPatientNotification(patient);
        
        // ล้างฟอร์ม
        handleClearForm();
        
        // อาจจะ redirect หรือแสดงข้อมูลผู้ป่วยที่สร้างใหม่
        logger.debug('Patient created successfully:', patient);
      } else {
        throw new Error(response.error?.message || 'การลงทะเบียนไม่สำเร็จ');
      }
      
    } catch (error: any) {
      logger.error("Error submitting:", error);
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
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
        patientName: patient.thai_name || formData.thaiName || '',
        patientPhone: patient.phone || formData.phone || '',
        patientEmail: patient.email || formData.email || '',
        recordType: 'patient_registration',
        recordId: patient.id || patient.hn || '',
        recordTitle: 'ลงทะเบียนผู้ป่วยใหม่',
        recordDescription: `ยินดีต้อนรับ! คุณได้ลงทะเบียนเป็นผู้ป่วยของโรงพยาบาลเรียบร้อยแล้ว หมายเลข HN: ${patient.hn || patient.hospital_number}`,
        recordDetails: {
          hospitalNumber: patient.hn || patient.hospital_number,
          patientName: patient.thai_name || formData.thaiName,
          registrationDate: new Date().toLocaleDateString('th-TH'),
          nextSteps: 'คุณสามารถใช้หมายเลข HN นี้เพื่อเช็คอินและรับบริการทางการแพทย์'
        },
        createdBy: user?.id || '',
        createdByName: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่',
        createdAt: new Date().toISOString()
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
          patientName: patient.thai_name || formData.thaiName,
          registrationDate: new Date().toISOString(),
          personalInfo: {
            thaiName: patient.thai_name || formData.thaiName,
            englishName: patient.english_name || formData.englishName,
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
          patientName: patient.thai_name || formData.thaiName || ''
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
                onClick={handleSearch}
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

          {/* Search Status */}
          {searchResult && (
            <div className={`mt-4 p-4 border rounded-lg ${
              searchResult.isExistingPatient 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className={`w-5 h-5 mr-2 ${searchResult.isExistingPatient ? 'text-red-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    {searchResult.isExistingPatient ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className={`font-medium ${searchResult.isExistingPatient ? 'text-red-800' : 'text-blue-800'}`}>
                    {searchResult.isExistingPatient ? 'ผู้ป่วยมีการลงทะเบียนแล้ว' : 'พบข้อมูลผู้ใช้ในระบบ'}
                  </span>
                </div>
                {!searchResult.isExistingPatient && (
                  <button
                    onClick={handleLoadUserData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    ดึงข้อมูล
                  </button>
                )}
              </div>
              <div className={`mt-2 text-sm ${searchResult.isExistingPatient ? 'text-red-700' : 'text-blue-700'}`}>
                <p><strong>ชื่อ:</strong> {searchResult.personal_info?.thai_name || searchResult.thai_name || searchResult.first_name}</p>
                <p><strong>อีเมล:</strong> {searchResult.contact_info?.email || searchResult.email}</p>
                <p><strong>โทรศัพท์:</strong> {searchResult.contact_info?.phone || searchResult.phone}</p>
                {searchResult.isExistingPatient ? (
                  <div className="mt-2 p-3 bg-red-100 rounded-lg">
                    <p className="font-medium text-red-800">⚠️ ผู้ป่วยนี้มีการลงทะเบียนแล้ว</p>
                    <p className="text-red-700"><strong>HN ID:</strong> {searchResult.hospital_number || searchResult.hn}</p>
                    <p className="text-red-600 text-xs mt-1">ไม่สามารถลงทะเบียนซ้ำได้ กรุณาตรวจสอบข้อมูลผู้ป่วยในระบบ</p>
                  </div>
                ) : (
                  <p className="mt-1 text-blue-600">กดปุ่ม "ดึงข้อมูล" เพื่อนำข้อมูลลงในฟอร์ม</p>
                )}
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
            {/* ข้อมูลส่วนตัว */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">ข้อมูลส่วนตัว</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ชื่อ-นามสกุล (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.thaiName}
                      onChange={(e) => handleInputChange("thaiName", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.thaiName ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="นาย/นาง/นางสาว ชื่อ นามสกุล"
                    />
                    {errors.thaiName && <p className="text-red-500 text-sm mt-1">{errors.thaiName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ชื่อ-นามสกุล (ภาษาอังกฤษ)
                    </label>
                    <input
                      type="text"
                      value={formData.englishName}
                      onChange={(e) => handleInputChange("englishName", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mr./Mrs./Ms. First Name Last Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      เพศ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.gender ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      วันเกิด <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">วัน</label>
                        <select
                          value={formData.birthDay}
                          onChange={(e) => handleInputChange("birthDay", parseInt(e.target.value))}
                          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.birthDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">เดือน</label>
                        <select
                          value={formData.birthMonth}
                          onChange={(e) => handleInputChange("birthMonth", parseInt(e.target.value))}
                          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.birthDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">ปี (พ.ศ.)</label>
                        <select
                          value={formData.birthYear}
                          onChange={(e) => handleInputChange("birthYear", parseInt(e.target.value))}
                          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.birthDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          {Array.from({ length: 100 }, (_, i) => 2567 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      เลขบัตรประชาชน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange("nationalId", e.target.value.replace(/\D/g, ''))}
                      maxLength={13}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.nationalId ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="1234567890123"
                    />
                    {errors.nationalId && <p className="text-red-500 text-sm mt-1">{errors.nationalId}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลติดต่อ */}
            <div className="border-t pt-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">ข้อมูลติดต่อ</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0812345678"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-slate-700 mb-4">ที่อยู่</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        บ้านเลขที่ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.houseNumber}
                        onChange={(e) => handleInputChange("houseNumber", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.houseNumber ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="123/45"
                      />
                      {errors.houseNumber && <p className="text-red-500 text-sm mt-1">{errors.houseNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ตำบล/แขวง <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.subDistrict}
                        onChange={(e) => handleInputChange("subDistrict", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.subDistrict ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="ตำบล/แขวง"
                      />
                      {errors.subDistrict && <p className="text-red-500 text-sm mt-1">{errors.subDistrict}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        อำเภอ/เขต <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => handleInputChange("district", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.district ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="อำเภอ/เขต"
                      />
                      {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        จังหวัด <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => handleInputChange("province", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.province ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="จังหวัด"
                      />
                      {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        รหัสไปรษณีย์
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value.replace(/\D/g, ''))}
                        maxLength={5}
                        className="w-full md:w-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลเพิ่มเติม */}
            <div className="border-t pt-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-semibold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">ข้อมูลเพิ่มเติม</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ศาสนา <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.religion}
                    onChange={(e) => handleInputChange("religion", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.religion ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">เลือกศาสนา</option>
                    <option value="buddhist">พุทธ</option>
                    <option value="islam">อิสลาม</option>
                    <option value="christian">คริสต์</option>
                    <option value="hindu">ฮินดู</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                  {errors.religion && <p className="text-red-500 text-sm mt-1">{errors.religion}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    สัญชาติ
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ไทย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    เชื้อชาติ
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ไทย"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลสุขภาพ */}
            <div className="border-t pt-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-600 font-semibold">4</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">ข้อมูลสุขภาพ</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      กรุ๊ปเลือด <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.bloodGroup ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">เลือกกรุ๊ปเลือด</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                    {errors.bloodGroup && <p className="text-red-500 text-sm mt-1">{errors.bloodGroup}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rh Factor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.rhFactor}
                      onChange={(e) => handleInputChange("rhFactor", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.rhFactor ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">เลือก Rh</option>
                      <option value="positive">Positive (+)</option>
                      <option value="negative">Negative (-)</option>
                    </select>
                    {errors.rhFactor && <p className="text-red-500 text-sm mt-1">{errors.rhFactor}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      โรคประจำตัว
                    </label>
                    <textarea
                      value={formData.chronicDiseases}
                      onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ระบุโรคประจำตัว (ถ้ามี) เช่น เบาหวาน, ความดันโลหิตสูง"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ประวัติแพ้ยา
                    </label>
                    <textarea
                      value={formData.drugAllergies}
                      onChange={(e) => handleInputChange("drugAllergies", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ระบุยาหรือสารที่แพ้ (ถ้ามี) เช่น ยาแก้ปวด, ยาปฏิชีวนะ"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-8">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || (searchResult && searchResult.isExistingPatient)}
                  className={`px-8 py-3 rounded-lg font-medium transition-all ${
                    isSubmitting || (searchResult && searchResult.isExistingPatient)
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
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
                  ) : searchResult && searchResult.isExistingPatient ? (
                    'ไม่สามารถลงทะเบียนได้'
                  ) : (
                    'ลงทะเบียน'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">ข้อมูลสำคัญ:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• ข้อมูลที่มี (*) เป็นข้อมูลที่จำเป็นต้องกรอก</li>
                <li>• หมายเลข HN จะถูกสร้างอัตโนมัติหลังจากลงทะเบียนสำเร็จ</li>
                <li>• ข้อมูลจะถูกเข้ารหัสและเก็บอย่างปลอดภัย</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
