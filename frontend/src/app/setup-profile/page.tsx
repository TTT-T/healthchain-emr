"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Heart, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface ProfileData {
  // Names (4 fields)
  thaiFirstName: string;
  thaiLastName: string;
  englishFirstName: string;
  englishLastName: string;
  
  // Personal Info
  nationalId: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  phone: string;
  
  // Address Info
  address: string;
  idCardAddress: string;
  currentAddress: string;
  
  // Contact Info
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Medical Info
  allergies: string;
  drugAllergies: string;
  foodAllergies: string;
  environmentAllergies: string;
  medicalHistory: string;
  currentMedications: string;
  chronicDiseases: string;
  
  // Physical Info
  weight: string;
  height: string;
  
  // Additional Info
  occupation: string;
  education: string;
  maritalStatus: string;
  religion: string;
  race: string;
  
  // Insurance Info
  insuranceType: string;
  insuranceNumber: string;
  insuranceExpiryDate: string;
}

// Helper function to get dashboard URL based on user role
const getDashboardUrl = (user: any) => {
  if (!user) return '/login';
  
  if (user.role === 'patient') {
    return '/accounts/patient/dashboard';
  } else if (user.role === 'doctor' || user.role === 'nurse') {
    return '/emr/dashboard';
  } else if (user.role === 'admin') {
    return '/admin/dashboard';
  } else if (user.role === 'external_requester') {
    return '/external-requesters/dashboard';
  } else {
    return '/emr/dashboard'; // Default fallback
  }
};

export default function SetupProfile() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<ProfileData>({
    // Names (4 fields)
    thaiFirstName: '',
    thaiLastName: '',
    englishFirstName: '',
    englishLastName: '',
    
    // Personal Info
    nationalId: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    phone: '',
    
    // Address Info
    address: '',
    idCardAddress: '',
    currentAddress: '',
    
    // Contact Info
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Medical Info
    allergies: '',
    drugAllergies: '',
    foodAllergies: '',
    environmentAllergies: '',
    medicalHistory: '',
    currentMedications: '',
    chronicDiseases: '',
    
    // Physical Info
    weight: '',
    height: '',
    
    // Additional Info
    occupation: '',
    education: '',
    maritalStatus: '',
    religion: '',
    race: '',
    
    // Insurance Info
    insuranceType: '',
    insuranceNumber: '',
    insuranceExpiryDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load existing profile data
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await apiClient.getCompleteProfile();
        
        if (response.statusCode === 200 && response.data) {
          const profile = response.data;
          
          // Map existing data to form fields
          setFormData({
            // Names (4 fields)
            thaiFirstName: profile.thaiFirstName || '',
            thaiLastName: profile.thaiLastName || '',
            englishFirstName: profile.englishFirstName || profile.firstName || '',
            englishLastName: profile.englishLastName || profile.lastName || '',
            
            // Personal Info
            nationalId: profile.nationalId || '',
            birthDate: profile.birthDate || '',
            gender: profile.gender || '',
            bloodType: profile.bloodType || '',
            phone: profile.phone || '',
            
            // Address Info
            address: profile.address || '',
            idCardAddress: profile.idCardAddress || '',
            currentAddress: profile.currentAddress || '',
            
            // Contact Info
            emergencyContactName: profile.emergencyContactName || '',
            emergencyContactPhone: profile.emergencyContactPhone || '',
            emergencyContactRelation: profile.emergencyContactRelation || '',
            
            // Medical Info
            allergies: profile.allergies || '',
            drugAllergies: profile.drugAllergies || '',
            foodAllergies: profile.foodAllergies || '',
            environmentAllergies: profile.environmentAllergies || '',
            medicalHistory: profile.medicalHistory || '',
            currentMedications: profile.currentMedications || '',
            chronicDiseases: profile.chronicDiseases || '',
            
            // Physical Info
            weight: profile.weight ? profile.weight.toString() : '',
            height: profile.height ? profile.height.toString() : '',
            
            // Additional Info
            occupation: profile.occupation || '',
            education: profile.education || '',
            maritalStatus: profile.maritalStatus || '',
            religion: profile.religion || '',
            race: profile.race || '',
            
            // Insurance Info
            insuranceType: profile.insuranceType || '',
            insuranceNumber: profile.insuranceNumber || '',
            insuranceExpiryDate: profile.insuranceExpiryDate || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Don't show error for empty profile, it's expected for new users
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      loadExistingProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Names validation (at least Thai or English)
    if (!formData.thaiFirstName && !formData.englishFirstName) {
      newErrors.thaiFirstName = 'กรุณากรอกชื่อ (ไทยหรืออังกฤษ)';
    }
    if (!formData.thaiLastName && !formData.englishLastName) {
      newErrors.thaiLastName = 'กรุณากรอกนามสกุล (ไทยหรืออังกฤษ)';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
    }

    if (formData.emergencyContactPhone && !phoneRegex.test(formData.emergencyContactPhone.replace(/[-\s]/g, ''))) {
      newErrors.emergencyContactPhone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
    }

    // National ID validation
    if (formData.nationalId && formData.nationalId.length !== 13) {
      newErrors.nationalId = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check if user has completed profile already
    if (user?.profileCompleted) {
      console.log('🔍 Setup Profile - User already completed profile, redirecting to dashboard');
      const redirectPath = getDashboardUrl(user);
      window.location.href = redirectPath;
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Setup Profile - Submitting:', formData);
      console.log('🔍 Setup Profile - User:', user);
      
      // Check token before proceeding
      const token = apiClient.getAccessToken();
      console.log('🔍 Setup Profile - Token exists:', !!token);
      
      // If no token, redirect to login
      if (!token) {
        console.log('🔍 Setup Profile - No token, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      // Ensure token is also set in cookie for middleware
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${60 * 60}; SameSite=Lax`;
        console.log('🔍 Setup Profile - Token set in cookie');
      }
      
      // Save profile data and mark as completed
      console.log('🔍 Setup Profile - Saving profile data...');
      
      try {
        // Check if there's any data to save
        const hasDataToSave = Object.values(formData).some(value => value && value.trim() !== '');
        
        if (hasDataToSave) {
          console.log('🔍 Setup Profile - Updating profile data...');
          
          // Transform all form data to backend format
          const profileData = {
            // Names (4 fields)
            thaiFirstName: formData.thaiFirstName,
            thaiLastName: formData.thaiLastName,
            englishFirstName: formData.englishFirstName,
            englishLastName: formData.englishLastName,
            
            // Personal Info
            nationalId: formData.nationalId,
            birthDate: formData.birthDate,
            gender: formData.gender,
            bloodType: formData.bloodType,
            phone: formData.phone,
            
            // Address Info
            address: formData.address,
            idCardAddress: formData.idCardAddress,
            currentAddress: formData.currentAddress,
            
            // Contact Info
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            emergencyContactRelation: formData.emergencyContactRelation,
            
            // Medical Info
            allergies: formData.allergies,
            drugAllergies: formData.drugAllergies,
            foodAllergies: formData.foodAllergies,
            environmentAllergies: formData.environmentAllergies,
            medicalHistory: formData.medicalHistory,
            currentMedications: formData.currentMedications,
            chronicDiseases: formData.chronicDiseases,
            
            // Physical Info
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            
            // Additional Info
            occupation: formData.occupation,
            education: formData.education,
            maritalStatus: formData.maritalStatus,
            religion: formData.religion,
            race: formData.race,
            
            // Insurance Info
            insuranceType: formData.insuranceType,
            insuranceNumber: formData.insuranceNumber,
            insuranceExpiryDate: formData.insuranceExpiryDate,
            
            // Mark profile as completed
            profileCompleted: true
          };
          
          const profileResponse = await apiClient.updateCompleteProfile(profileData as any);
          
          if (profileResponse.statusCode !== 200) {
            throw new Error(profileResponse.error?.message || 'Failed to update profile data');
          }
          
          console.log('🔍 Setup Profile - Profile data updated successfully');
        } else {
          // If no data to save, just mark profile as completed
          console.log('🔍 Setup Profile - Marking profile as completed...');
          const response = await apiClient.completeProfileSetup();
          
          if (response.data && !response.error) {
            console.log('🔍 Setup Profile - Profile marked as completed successfully');
          } else {
            throw new Error(response.error?.message || 'Failed to complete profile setup');
          }
        }
        
        // Update user data in context
        window.dispatchEvent(new CustomEvent('refreshUserData'));
      } catch (error) {
        console.error('🔍 Setup Profile - Error saving profile:', error);
        throw error; // Re-throw to be caught by outer try-catch
      }
      
      // Show success message
      console.log('🔍 Setup Profile - Profile saved successfully');
      setIsSuccess(true);
      setErrors({});
      
      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        const redirectPath = getDashboardUrl(user);
        console.log('🔍 Setup Profile - Redirecting to:', redirectPath);
        window.location.href = redirectPath;
      }, 2000); // Wait 2 seconds before redirect
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => {
              const redirectPath = user ? getDashboardUrl(user) : '/accounts/patient/dashboard';
              window.location.href = redirectPath;
            }}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            {user && user.profileCompleted ? 'กลับไปแดชบอร์ด' : 'กลับไปหน้าหลัก'}
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user && user.profileCompleted ? 'อัปเดตโปรไฟล์' : 'ตั้งค่าโปรไฟล์เพิ่มเติม'}
                </h1>
                <p className="text-gray-600">
                  {user && user.profileCompleted 
                    ? 'อัปเดตข้อมูลโปรไฟล์ของคุณ' 
                    : 'กรอกข้อมูลเพิ่มเติมเพื่อความสมบูรณ์ของโปรไฟล์'
                  }
                </p>
                {user && (
                  <p className="text-sm text-blue-600 mt-1">
                    สวัสดี {user.firstName} {user.lastName} ({user.role})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Names Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลชื่อ-นามสกุล</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thai Names */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">ชื่อภาษาไทย</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="thaiFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ (ไทย)
                    </label>
                    <input
                      id="thaiFirstName"
                      name="thaiFirstName"
                      type="text"
                      value={formData.thaiFirstName}
                      onChange={handleInputChange}
                      placeholder="ชื่อ"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.thaiFirstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.thaiFirstName && <p className="text-red-500 text-sm mt-1">{errors.thaiFirstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="thaiLastName" className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล (ไทย)
                    </label>
                    <input
                      id="thaiLastName"
                      name="thaiLastName"
                      type="text"
                      value={formData.thaiLastName}
                      onChange={handleInputChange}
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
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">ชื่อภาษาอังกฤษ</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="englishFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ (อังกฤษ)
                    </label>
                    <input
                      id="englishFirstName"
                      name="englishFirstName"
                      type="text"
                      value={formData.englishFirstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.englishFirstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.englishFirstName && <p className="text-red-500 text-sm mt-1">{errors.englishFirstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="englishLastName" className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล (อังกฤษ)
                    </label>
                    <input
                      id="englishLastName"
                      name="englishLastName"
                      type="text"
                      value={formData.englishLastName}
                      onChange={handleInputChange}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  เลขบัตรประชาชน
                </label>
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  placeholder="1234567890123"
                  maxLength={13}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.nationalId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.nationalId && <p className="text-red-500 text-sm mt-1">{errors.nationalId}</p>}
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  วันเกิด
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                    errors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  เพศ
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
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

              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                  หมู่เลือด
                </label>
                <select
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                    errors.bloodType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
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
                {errors.bloodType && <p className="text-red-500 text-sm mt-1">{errors.bloodType}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0812345678"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลผู้ติดต่อฉุกเฉิน</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="ชื่อ-นามสกุล"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.emergencyContactName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.emergencyContactName && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName}</p>}
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
                  onChange={handleInputChange}
                  placeholder="0812345678"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.emergencyContactPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.emergencyContactPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone}</p>}
              </div>

              <div>
                <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700 mb-2">
                  ความสัมพันธ์
                </label>
                <select
                  id="emergencyContactRelation"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                    errors.emergencyContactRelation ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">เลือกความสัมพันธ์</option>
                  <option value="parent">บิดา/มารดา</option>
                  <option value="spouse">คู่สมรส</option>
                  <option value="child">บุตร</option>
                  <option value="sibling">พี่น้อง</option>
                  <option value="relative">ญาติ</option>
                  <option value="friend">เพื่อน</option>
                  <option value="other">อื่นๆ</option>
                </select>
                {errors.emergencyContactRelation && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactRelation}</p>}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Heart size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลทางการแพทย์</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                  การแพ้ยา/อาหาร/สิ่งแวดล้อม
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="ระบุการแพ้ต่างๆ เช่น แพ้ยาแอสไพริน, แพ้อาหารทะเล"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                  ประวัติการเจ็บป่วย
                </label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder="ระบุประวัติการเจ็บป่วย เช่น เบาหวาน, ความดันโลหิตสูง"
                  rows={3}
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
                  onChange={handleInputChange}
                  placeholder="ระบุยาที่ใช้ประจำ เช่น เมตฟอร์มิน 500mg วันละ 2 ครั้ง"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลประกัน</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="insuranceType" className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทประกัน
                </label>
                <select
                  id="insuranceType"
                  name="insuranceType"
                  value={formData.insuranceType}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="เลขที่ประกัน"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="insuranceExpiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  วันหมดอายุ
                </label>
                <input
                  id="insuranceExpiryDate"
                  name="insuranceExpiryDate"
                  type="date"
                  value={formData.insuranceExpiryDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-green-800">บันทึกข้อมูลสำเร็จ! กำลังนำคุณไปยังหน้าหลัก...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <p className="text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={async () => {
                // Check if user has completed profile already
                if (user?.profileCompleted) {
                  console.log('🔍 Setup Profile - User already completed profile, redirecting to dashboard');
                  const redirectPath = getDashboardUrl(user);
                  window.location.href = redirectPath;
                  return;
                }
                
                try {
                  setIsSubmitting(true);
                  
                  // Call API to complete profile setup
                  console.log('🔍 Setup Profile - Skipping setup, marking profile as completed...');
                  const response = await apiClient.completeProfileSetup();
                  
                  if (response.data && !response.error) {
                    console.log('🔍 Setup Profile - Profile marked as completed successfully');
                    
                    // Update user data in context
                    window.dispatchEvent(new CustomEvent('refreshUserData'));
                    
                    // Redirect to appropriate dashboard
                    const redirectPath = getDashboardUrl(user);
                    window.location.href = redirectPath;
                  } else {
                    throw new Error(response.error?.message || 'Failed to complete profile setup');
                  }
                } catch (error) {
                  console.error('🔍 Setup Profile - Error skipping setup:', error);
                  setErrors({ submit: 'เกิดข้อผิดพลาดในการข้ามขั้นตอน กรุณาลองใหม่อีกครั้ง' });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : (user && user.profileCompleted ? 'ยกเลิก' : 'ข้ามขั้นตอนนี้')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {user && user.profileCompleted ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}