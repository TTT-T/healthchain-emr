"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Heart, AlertTriangle, Save, ArrowLeft, Activity, Calendar, Trash2 } from 'lucide-react';
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
  birthDay: string;
  birthMonth: string;
  birthYear: string;
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
  insuranceExpiryDay: string;
  insuranceExpiryMonth: string;
  insuranceExpiryYear: string;
}

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  deletable?: boolean;
  onDelete?: () => void;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  options,
  required = false,
  disabled = false,
  placeholder,
  min,
  max,
  onDelete,
  deletable = false
}) => {
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 transition-colors"
          >
            <option value="">เลือก{label}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-vertical"
          />
        );
      default:
        return (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || null : e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 transition-colors"
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {deletable && onDelete && value && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1"
            title={`ลบ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {renderInput()}
    </div>
  );
};

// Helper function to get dashboard URL based on user role
const getDashboardUrl = (user: any) => {
  if (!user) return '/login';
  
  if (user.role === 'patient') {
    return '/accounts/patient/dashboard';
  } else if (user.role === 'doctor' || user.role === 'nurse') {
    return '/emr/dashboard';
  } else if (user.role === 'admin') {
    return '/admin';
  } else if (user.role === 'external_requester') {
    return '/external-requesters/dashboard';
  } else {
    return '/emr/dashboard'; // Default fallback
  }
};

// Helper function to format date display
const formatDateDisplay = (day: string, month: string, year: string) => {
  if (!day || !month || !year) return 'ไม่ระบุ';
  
  const dayNum = parseInt(day);
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return 'ไม่ระบุ';
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  return `${dayNum} ${monthNames[monthNum - 1]} ${yearNum}`;
};

// Helper function to calculate age
  const calculateAge = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return null;
    
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
    
    // Convert Buddhist Era to Christian Era
    const christianYear = yearNum - 543;
    const birthDate = new Date(christianYear, monthNum - 1, dayNum);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    return adjustedAge;
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
    birthDay: '',
    birthMonth: '',
    birthYear: '',
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
    insuranceExpiryDate: '',
    insuranceExpiryDay: '',
    insuranceExpiryMonth: '',
    insuranceExpiryYear: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = [
      'thaiFirstName', 'thaiLastName', 'englishFirstName', 'englishLastName',
      'nationalId', 'birthDay', 'birthMonth', 'birthYear', 'gender', 'bloodType',
      'phone', 'address', 'emergencyContactName', 'emergencyContactPhone',
      'drugAllergies', 'foodAllergies', 'environmentAllergies', 'chronicDiseases',
      'weight', 'height', 'occupation', 'education', 'maritalStatus', 'religion', 'race',
      'insuranceType', 'insuranceNumber', 'insuranceExpiryDay', 'insuranceExpiryMonth', 'insuranceExpiryYear'
    ];
    
    const filledFields = fields.filter(field => {
      const value = formData[field as keyof ProfileData];
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((filledFields.length / fields.length) * 100);
  };
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
          console.log('🔍 Setup Profile - Loaded profile data:', profile);
      console.log('🔍 Birth Date from API:', {
        birthDate: profile.birthDate,
        birthDay: profile.birthDay,
        birthMonth: profile.birthMonth,
        birthYear: profile.birthYear,
      });
      console.log('🔍 Insurance Expiry Date from API:', {
        insuranceExpiryDate: profile.insuranceExpiryDate,
        insuranceExpiryDay: profile.insuranceExpiryDay,
        insuranceExpiryMonth: profile.insuranceExpiryMonth,
        insuranceExpiryYear: profile.insuranceExpiryYear,
      });
      console.log('🔍 Medical Info from API:', {
        allergies: profile.allergies,
        drugAllergies: profile.drugAllergies,
        foodAllergies: profile.foodAllergies,
        environmentAllergies: profile.environmentAllergies,
        medicalHistory: profile.medicalHistory,
        currentMedications: profile.currentMedications,
        chronicDiseases: profile.chronicDiseases,
      });
          
          // Map existing data to form fields (using correct field names from API)
          setFormData({
            // Names (4 fields)
            thaiFirstName: profile.thaiName || '',
            thaiLastName: profile.thaiLastName || '',
            englishFirstName: profile.firstName || '',
            englishLastName: profile.lastName || '',
            
            // Personal Info
            nationalId: profile.nationalId || '',
            birthDate: profile.birthDate || '',
            birthDay: profile.birthDay ? profile.birthDay.toString() : '',
            birthMonth: profile.birthMonth ? profile.birthMonth.toString() : '',
            birthYear: profile.birthYear ? profile.birthYear.toString() : '',
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
            insuranceExpiryDate: profile.insuranceExpiryDate || '',
            insuranceExpiryDay: profile.insuranceExpiryDay ? profile.insuranceExpiryDay.toString() : '',
            insuranceExpiryMonth: profile.insuranceExpiryMonth ? profile.insuranceExpiryMonth.toString() : '',
            insuranceExpiryYear: profile.insuranceExpiryYear ? profile.insuranceExpiryYear.toString() : ''
          });
          
          console.log('🔍 Form Data after setting:', {
            allergies: formData.allergies,
            drugAllergies: formData.drugAllergies,
            foodAllergies: formData.foodAllergies,
            environmentAllergies: formData.environmentAllergies,
            medicalHistory: formData.medicalHistory,
            currentMedications: formData.currentMedications,
            chronicDiseases: formData.chronicDiseases,
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
    
    // Debug date fields
    if (name === 'birthDay' || name === 'birthMonth' || name === 'birthYear') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      console.log('🔍 Birth Date Debug:', {
        birthDay: newFormData.birthDay,
        birthMonth: newFormData.birthMonth,
        birthYear: newFormData.birthYear,
        hasAllFields: newFormData.birthDay !== '' && newFormData.birthMonth !== '' && newFormData.birthYear !== ''
      });
    }
    
    if (name === 'insuranceExpiryDay' || name === 'insuranceExpiryMonth' || name === 'insuranceExpiryYear') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      console.log('🔍 Insurance Expiry Date Debug:', {
        insuranceExpiryDay: newFormData.insuranceExpiryDay,
        insuranceExpiryMonth: newFormData.insuranceExpiryMonth,
        insuranceExpiryYear: newFormData.insuranceExpiryYear,
        hasAllFields: newFormData.insuranceExpiryDay !== '' && newFormData.insuranceExpiryMonth !== '' && newFormData.insuranceExpiryYear !== ''
      });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFormFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Debug date fields
    if (name === 'birthDay' || name === 'birthMonth' || name === 'birthYear') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      console.log('🔍 Birth Date Field Changed:', {
        field: name,
        value: value,
        birthDay: newFormData.birthDay,
        birthMonth: newFormData.birthMonth,
        birthYear: newFormData.birthYear,
        hasAllFields: newFormData.birthDay !== '' && newFormData.birthMonth !== '' && newFormData.birthYear !== ''
      });
    }
    
    if (name === 'insuranceExpiryDay' || name === 'insuranceExpiryMonth' || name === 'insuranceExpiryYear') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      console.log('🔍 Insurance Expiry Date Field Changed:', {
        field: name,
        value: value,
        insuranceExpiryDay: newFormData.insuranceExpiryDay,
        insuranceExpiryMonth: newFormData.insuranceExpiryMonth,
        insuranceExpiryYear: newFormData.insuranceExpiryYear,
        hasAllFields: newFormData.insuranceExpiryDay !== '' && newFormData.insuranceExpiryMonth !== '' && newFormData.insuranceExpiryYear !== ''
      });
    }

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
          
          // Transform all form data to backend format (using correct field names)
          const profileData = {
            // Names (4 fields)
            thaiName: formData.thaiFirstName,
            thaiLastName: formData.thaiLastName,
            firstName: formData.englishFirstName,
            lastName: formData.englishLastName,
            
            // Personal Info
            nationalId: formData.nationalId,
            birthDate: formData.birthDate,
            birthDay: formData.birthDay ? parseInt(formData.birthDay) : null,
            birthMonth: formData.birthMonth ? parseInt(formData.birthMonth) : null,
            birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
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
            insuranceExpiryDay: formData.insuranceExpiryDay ? parseInt(formData.insuranceExpiryDay) : null,
            insuranceExpiryMonth: formData.insuranceExpiryMonth ? parseInt(formData.insuranceExpiryMonth) : null,
            insuranceExpiryYear: formData.insuranceExpiryYear ? parseInt(formData.insuranceExpiryYear) : null,
            
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
                {(() => {
                  const completionPercentage = calculateProfileCompletion();
                  const isHighCompletion = completionPercentage >= 80;
                  
                  if (user && user.profileCompleted) {
                    return (
                      <p className="text-gray-600">
                        อัปเดตข้อมูลโปรไฟล์ของคุณ
                      </p>
                    );
                  } else if (isHighCompletion) {
                    return (
                      <p className="text-green-600 font-medium">
                        🎉 โปรไฟล์ของคุณเกือบสมบูรณ์แล้ว! ({completionPercentage}%)
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-gray-600">
                        กรอกข้อมูลเพิ่มเติมเพื่อความสมบูรณ์ของโปรไฟล์ ({completionPercentage}%)
                      </p>
                    );
                  }
                })()}
                {user && (
                  <p className="text-sm text-blue-600 mt-1">
                    สวัสดี {user.firstName} {user.lastName} ({user.role})
                  </p>
                )}
                
                {/* Progress Bar */}
                {!user?.profileCompleted && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>ความคืบหน้าโปรไฟล์</span>
                      <span>{calculateProfileCompletion()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          calculateProfileCompletion() >= 80 
                            ? 'bg-green-500' 
                            : calculateProfileCompletion() >= 50 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${calculateProfileCompletion()}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
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
              {/* Thai Names */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    ชื่อภาษาไทย
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
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

            <div className="space-y-6">
              {/* Row 1: National ID and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    เพศ
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Birth Date - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  วันเกิด
                </label>
                
                {/* Display formatted date if all fields are filled */}
                {(() => {
                  const hasAllFields = formData.birthDay !== '' && formData.birthMonth !== '' && formData.birthYear !== '';
                  const isValidDate = hasAllFields && 
                    formData.birthDay !== '1' && 
                    formData.birthMonth !== '1' && 
                    formData.birthYear !== '2533';
                  
                  console.log('🔍 Birth Date Display Check:', {
                    birthDay: formData.birthDay,
                    birthMonth: formData.birthMonth,
                    birthYear: formData.birthYear,
                    hasAllFields,
                    isValidDate
                  });
                  
                  return isValidDate ? (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Calendar size={16} />
                        <span className="font-medium">
                          {formatDateDisplay(formData.birthDay, formData.birthMonth, formData.birthYear)}
                        </span>
                        {calculateAge(formData.birthDay, formData.birthMonth, formData.birthYear) && (
                          <span className="text-blue-600">
                            (อายุ {calculateAge(formData.birthDay, formData.birthMonth, formData.birthYear)} ปี)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : hasAllFields ? (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle size={16} />
                        <span className="text-sm">กรุณากรอกข้อมูลวันเกิดที่ถูกต้อง</span>
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    label="วัน"
                    value={formData.birthDay}
                    onChange={(value) => handleFormFieldChange('birthDay', value)}
                    type="number"
                    placeholder="15"
                    min="1"
                    max="31"
                  />
                  <FormField
                    label="เดือน"
                    value={formData.birthMonth}
                    onChange={(value) => handleFormFieldChange('birthMonth', value)}
                    type="select"
                    options={[
                      { value: 1, label: 'มกราคม' },
                      { value: 2, label: 'กุมภาพันธ์' },
                      { value: 3, label: 'มีนาคม' },
                      { value: 4, label: 'เมษายน' },
                      { value: 5, label: 'พฤษภาคม' },
                      { value: 6, label: 'มิถุนายน' },
                      { value: 7, label: 'กรกฎาคม' },
                      { value: 8, label: 'สิงหาคม' },
                      { value: 9, label: 'กันยายน' },
                      { value: 10, label: 'ตุลาคม' },
                      { value: 11, label: 'พฤศจิกายน' },
                      { value: 12, label: 'ธันวาคม' }
                    ]}
                  />
                  <FormField
                    label="ปี (พ.ศ.)"
                    value={formData.birthYear}
                    onChange={(value) => handleFormFieldChange('birthYear', value)}
                    type="number"
                    placeholder="2543"
                    min="2400"
                    max="2700"
                  />
                </div>
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
                  การแพ้ทั่วไป
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="ระบุการแพ้ทั่วไป"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
                {/* Debug info */}
                <div className="mt-1 text-xs text-gray-500">
                  Debug: allergies value = "{formData.allergies}" (type: {typeof formData.allergies})
                </div>
              </div>

              <div>
                <label htmlFor="drugAllergies" className="block text-sm font-medium text-gray-700 mb-2">
                  การแพ้ยา
                </label>
                <textarea
                  id="drugAllergies"
                  name="drugAllergies"
                  value={formData.drugAllergies}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="ระบุการแพ้สิ่งแวดล้อม เช่น แพ้ฝุ่น, แพ้เกสรดอกไม้"
                  rows={2}
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
                <label htmlFor="chronicDiseases" className="block text-sm font-medium text-gray-700 mb-2">
                  โรคเรื้อรัง
                </label>
                <textarea
                  id="chronicDiseases"
                  name="chronicDiseases"
                  value={formData.chronicDiseases}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="ระบุยาที่ใช้ประจำ เช่น เมตฟอร์มิน 500mg วันละ 2 ครั้ง"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Physical & Additional Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลส่วนตัวเพิ่มเติม</h2>
            </div>

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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="เช่น 170"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                  อาชีพ
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  placeholder="เช่น วิศวกร, ครู, พนักงานบริษัท"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
                  การศึกษา
                </label>
                <select
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                >
                  <option value="">เลือกระดับการศึกษา</option>
                  <option value="ประถมศึกษา">ประถมศึกษา</option>
                  <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                  <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                  <option value="ประกาศนียบัตรวิชาชีพ">ประกาศนียบัตรวิชาชีพ</option>
                  <option value="ประกาศนียบัตรวิชาชีพชั้นสูง">ประกาศนียบัตรวิชาชีพชั้นสูง</option>
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                </select>
              </div>

              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะสมรส
                </label>
                <select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                >
                  <option value="">เลือกสถานะสมรส</option>
                  <option value="single">โสด</option>
                  <option value="married">สมรส</option>
                  <option value="divorced">หย่า</option>
                  <option value="widowed">หม้าย</option>
                </select>
              </div>

              <div>
                <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-2">
                  ศาสนา
                </label>
                <select
                  id="religion"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                >
                  <option value="">เลือกศาสนา</option>
                  <option value="พุทธ">พุทธ</option>
                  <option value="คริสต์">คริสต์</option>
                  <option value="อิสลาม">อิสลาม</option>
                  <option value="ฮินดู">ฮินดู</option>
                  <option value="ซิกข์">ซิกข์</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-2">
                  เชื้อชาติ
                </label>
                <select
                  id="race"
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                >
                  <option value="">เลือกเชื้อชาติ</option>
                  <option value="ไทย">ไทย</option>
                  <option value="จีน">จีน</option>
                  <option value="อินเดีย">อินเดีย</option>
                  <option value="มลายู">มลายู</option>
                  <option value="ลาว">ลาว</option>
                  <option value="กัมพูชา">กัมพูชา</option>
                  <option value="พม่า">พม่า</option>
                  <option value="เวียดนาม">เวียดนาม</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
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
              </div>

              {/* Row 2: Insurance Expiry Date - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  วันหมดอายุ
                </label>
                
                {/* Display formatted expiry date if all fields are filled */}
                {(() => {
                  const hasAllFields = formData.insuranceExpiryDay !== '' && formData.insuranceExpiryMonth !== '' && formData.insuranceExpiryYear !== '';
                  const isValidDate = hasAllFields && 
                    formData.insuranceExpiryDay !== '1' && 
                    formData.insuranceExpiryMonth !== '1' && 
                    formData.insuranceExpiryYear !== '2533';
                  
                  console.log('🔍 Insurance Expiry Date Display Check:', {
                    insuranceExpiryDay: formData.insuranceExpiryDay,
                    insuranceExpiryMonth: formData.insuranceExpiryMonth,
                    insuranceExpiryYear: formData.insuranceExpiryYear,
                    hasAllFields,
                    isValidDate
                  });
                  
                  return isValidDate ? (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Calendar size={16} />
                        <span className="font-medium">
                          {formatDateDisplay(formData.insuranceExpiryDay, formData.insuranceExpiryMonth, formData.insuranceExpiryYear)}
                        </span>
                      </div>
                    </div>
                  ) : hasAllFields ? (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle size={16} />
                        <span className="text-sm">กรุณากรอกข้อมูลวันหมดอายุประกันที่ถูกต้อง</span>
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    label="วัน"
                    value={formData.insuranceExpiryDay}
                    onChange={(value) => handleFormFieldChange('insuranceExpiryDay', value)}
                    type="number"
                    placeholder="15"
                    min="1"
                    max="31"
                  />
                  <FormField
                    label="เดือน"
                    value={formData.insuranceExpiryMonth}
                    onChange={(value) => handleFormFieldChange('insuranceExpiryMonth', value)}
                    type="select"
                    options={[
                      { value: 1, label: 'มกราคม' },
                      { value: 2, label: 'กุมภาพันธ์' },
                      { value: 3, label: 'มีนาคม' },
                      { value: 4, label: 'เมษายน' },
                      { value: 5, label: 'พฤษภาคม' },
                      { value: 6, label: 'มิถุนายน' },
                      { value: 7, label: 'กรกฎาคม' },
                      { value: 8, label: 'สิงหาคม' },
                      { value: 9, label: 'กันยายน' },
                      { value: 10, label: 'ตุลาคม' },
                      { value: 11, label: 'พฤศจิกายน' },
                      { value: 12, label: 'ธันวาคม' }
                    ]}
                  />
                  <FormField
                    label="ปี (พ.ศ.)"
                    value={formData.insuranceExpiryYear}
                    onChange={(value) => handleFormFieldChange('insuranceExpiryYear', value)}
                    type="number"
                    placeholder="2570"
                    min="2400"
                    max="2700"
                  />
                </div>
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