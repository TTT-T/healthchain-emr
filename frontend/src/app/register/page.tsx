"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, Mail, User, Phone, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface FormData {
  titlePrefix: string;
  firstName: string;
  lastName: string;
  firstNameEn: string;
  lastNameEn: string;
  nationalId: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  gender: string;
  username: string;
  email: string;
  confirmEmail: string;
  phone: string;
  address: string;
  idCardAddress: string;
  bloodType: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function Register() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    titlePrefix: '',
    firstName: '',
    lastName: '',
    firstNameEn: '',
    lastNameEn: '',
    nationalId: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    username: '',
    email: '',
    confirmEmail: '',
    phone: '',
    address: '',
    idCardAddress: '',
    bloodType: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomTitle, setShowCustomTitle] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/"); // Let AuthContext handle role-based redirect
    }
  }, [isAuthenticated, router]);

  // Clear auth error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    // Handle custom title prefix
    if (name === 'titlePrefix') {
      if (value === 'other') {
        setShowCustomTitle(true);
        setFormData(prev => ({ ...prev, [name]: '' }));
      } else if (!showCustomTitle) {
        // Only handle select dropdown values when not in custom mode
        setShowCustomTitle(false);
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        // Handle custom input when in custom mode
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.titlePrefix) newErrors.titlePrefix = 'กรุณาเลือกหรือกรอกคำนำหน้า';
    if (!formData.firstName) newErrors.firstName = 'กรุณากรอกชื่อ';
    if (!formData.lastName) newErrors.lastName = 'กรุณากรอกนามสกุล';
    if (!formData.firstNameEn) newErrors.firstNameEn = 'กรุณากรอกชื่อภาษาอังกฤษ';
    if (!formData.lastNameEn) newErrors.lastNameEn = 'กรุณากรอกนามสกุลภาษาอังกฤษ';
    if (!formData.nationalId) newErrors.nationalId = 'กรุณากรอกเลขบัตรประชาชน';
    if (!formData.birthDay) newErrors.birthDay = 'กรุณาเลือกวันเกิด';
    if (!formData.birthMonth) newErrors.birthMonth = 'กรุณาเลือกเดือนเกิด';
    if (!formData.birthYear) newErrors.birthYear = 'กรุณาเลือกปีเกิด';
    if (!formData.gender) newErrors.gender = 'กรุณาเลือกเพศ';
    if (!formData.username) newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    if (!formData.email) newErrors.email = 'กรุณากรอกอีเมล';
    if (!formData.confirmEmail) newErrors.confirmEmail = 'กรุณายืนยันอีเมล';
    if (!formData.phone) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!formData.idCardAddress) newErrors.idCardAddress = 'กรุณากรอกที่อยู่ตามบัตรประชาชน';
    if (!formData.bloodType) newErrors.bloodType = 'กรุณาเลือกหมู่เลือด';
    if (!formData.password) newErrors.password = 'กรุณากรอกรหัสผ่าน';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Email confirmation
    if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'อีเมลไม่ตรงกัน';
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (formData.username && !usernameRegex.test(formData.username)) {
      newErrors.username = 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น (3-20 ตัวอักษร)';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
    }

    // National ID validation
    const nationalIdRegex = /^[0-9]{13}$/;
    if (formData.nationalId && !nationalIdRegex.test(formData.nationalId.replace(/[-\s]/g, ''))) {
      newErrors.nationalId = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }

    // English name validation
    const englishNameRegex = /^[a-zA-Z\s]+$/;
    if (formData.firstNameEn && !englishNameRegex.test(formData.firstNameEn)) {
      newErrors.firstNameEn = 'ชื่อภาษาอังกฤษต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น';
    }
    if (formData.lastNameEn && !englishNameRegex.test(formData.lastNameEn)) {
      newErrors.lastNameEn = 'นามสกุลภาษาอังกฤษต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น';
    }

    // Birth date validation (Buddhist Era to Christian Era)
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      const christianYear = parseInt(formData.birthYear) - 543;
      const birthDate = new Date(christianYear, parseInt(formData.birthMonth) - 1, parseInt(formData.birthDay));
      const today = new Date();
      
      if (birthDate > today) {
        newErrors.birthDay = 'วันเกิดไม่สามารถเป็นอนาคตได้';
      }
      
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        const actualAge = age - 1;
        if (actualAge < 15) {
          newErrors.birthYear = 'อายุต้องไม่น้อยกว่า 15 ปี';
        }
      } else if (age < 15) {
        newErrors.birthYear = 'อายุต้องไม่น้อยกว่า 15 ปี';
      }
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'กรุณายอมรับข้อกำหนดและเงื่อนไข';
    }
    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'กรุณายอมรับนโยบายความเป็นส่วนตัว';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstNameEn, // ใช้ชื่ออังกฤษเป็น firstName
        lastName: formData.lastNameEn,   // ใช้นามสกุลอังกฤษเป็น lastName
        thaiFirstName: formData.firstName, // เพิ่มชื่อไทย
        thaiLastName: formData.lastName,   // เพิ่มนามสกุลไทย
        phoneNumber: formData.phone,
        nationalId: formData.nationalId,
        birthDate: `${parseInt(formData.birthYear) - 543}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`,
        gender: formData.gender,
        address: formData.address,
        idCardAddress: formData.idCardAddress,
        bloodType: formData.bloodType,
      }) as { requiresEmailVerification?: boolean } | void;
      
      // Always redirect to verification required page for patients
      if (result && 'requiresEmailVerification' in result && result.requiresEmailVerification) {
        router.push(`/register/success?email=${encodeURIComponent(formData.email)}&verification=true`);
      } else {
        // For non-patient users, also show verification message
        router.push(`/register/success?email=${encodeURIComponent(formData.email)}&verification=true`);
      }
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already exists') || error.message?.includes('409') || error.statusCode === 409) {
        const thaiMessage = error.details?.message || 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ';
        setErrors({ 
          email: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น',
          submit: thaiMessage
        });
      } else if (error.message?.includes('validation')) {
        setErrors({ submit: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่' });
      } else {
        setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
      }
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return 'อ่อน';
    if (passwordStrength < 75) return 'ปานกลาง';
    return 'แข็งแกร่ง';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าแรก
            </Link>
          </div>
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">HealthChain</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">สมัครสมาชิก</h2>
          <p className="text-gray-600">สร้างบัญชีเพื่อเข้าใช้งานระบบ HealthChain</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
          {/* Development helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 mb-2">Development Mode - Quick Fill:</p>
              <button
                type="button"
                onClick={() => {
                  const timestamp = Date.now();
                  setFormData({
                    titlePrefix: 'นาย',
                    firstName: 'ทดสอบ',
                    lastName: 'ระบบ',
                    firstNameEn: 'Test',
                    lastNameEn: 'System',
                    nationalId: `1234567890${timestamp.toString().slice(-3)}`,
                    birthDay: '15',
                    birthMonth: '06',
                    birthYear: '2533',
                    gender: 'male',
                    username: `testuser${timestamp}`,
                    email: `test${timestamp}@example.com`,
                    confirmEmail: `test${timestamp}@example.com`,
                    phone: '0812345678',
                    address: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110',
                    bloodType: 'O+',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    acceptTerms: true,
                    acceptPrivacy: true
                  });
                }}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
              >
                เติมข้อมูลทดสอบ
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submit Error */}
            {(errors.submit || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-red-700 text-sm">{errors.submit || error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="text-blue-600" size={20} />
                ข้อมูลส่วนตัว
              </h3>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="titlePrefix" className="block text-sm font-medium text-gray-700 mb-2">
                    คำนำหน้า *
                  </label>
                  {showCustomTitle ? (
                    <div className="space-y-2">
                      <input
                        id="titlePrefix"
                        name="titlePrefix"
                        type="text"
                        value={formData.titlePrefix}
                        onChange={handleInputChange}
                        placeholder="กรอกคำนำหน้า"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                          errors.titlePrefix ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomTitle(false);
                          setFormData(prev => ({ ...prev, titlePrefix: '' }));
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <ArrowLeft size={14} />
                        กลับไปเลือกจากรายการ
                      </button>
                    </div>
                  ) : (
                    <select
                      id="titlePrefix"
                      name="titlePrefix"
                      value={formData.titlePrefix}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.titlePrefix ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">เลือกคำนำหน้า</option>
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="เด็กชาย">เด็กชาย</option>
                      <option value="เด็กหญิง">เด็กหญิง</option>
                      <option value="other">อื่น ๆ (กรอกเอง)</option>
                    </select>
                  )}
                  {errors.titlePrefix && <p className="text-red-500 text-sm mt-1">{errors.titlePrefix}</p>}
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="กรอกชื่อ"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    นามสกุล *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="กรอกนามสกุล"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* English Name Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstNameEn" className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ (ภาษาอังกฤษ) *
                  </label>
                  <input
                    id="firstNameEn"
                    name="firstNameEn"
                    type="text"
                    value={formData.firstNameEn}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.firstNameEn ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstNameEn && <p className="text-red-500 text-sm mt-1">{errors.firstNameEn}</p>}
                </div>

                <div>
                  <label htmlFor="lastNameEn" className="block text-sm font-medium text-gray-700 mb-2">
                    นามสกุล (ภาษาอังกฤษ) *
                  </label>
                  <input
                    id="lastNameEn"
                    name="lastNameEn"
                    type="text"
                    value={formData.lastNameEn}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.lastNameEn ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastNameEn && <p className="text-red-500 text-sm mt-1">{errors.lastNameEn}</p>}
                </div>
              </div>

              {/* National ID */}
              <div>
                <label htmlFor="nationalId" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User size={16} />
                  เลขบัตรประชาชน *
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

              {/* Username */}
              <div>
                <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User size={16} />
                  ชื่อผู้ใช้ *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="username123"
                  maxLength={20}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                <p className="text-gray-500 text-xs mt-1">ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น (3-20 ตัวอักษร)</p>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  เพศ *
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

              {/* Blood Type */}
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                  หมู่เลือด *
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

              {/* Address */}
              <div>
                <label htmlFor="idCardAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่ตามบัตรประชาชน *
                </label>
                <textarea
                  id="idCardAddress"
                  name="idCardAddress"
                  value={formData.idCardAddress}
                  onChange={handleInputChange}
                  placeholder="กรอกที่อยู่ตามบัตรประชาชน"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.idCardAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.idCardAddress && <p className="text-red-500 text-sm mt-1">{errors.idCardAddress}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่ปัจจุบัน (ถ้าแตกต่างจากบัตรประชาชน)
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="กรอกที่อยู่ปัจจุบัน (ถ้าแตกต่างจากบัตรประชาชน)"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันเดือนปีเกิด *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <select
                      id="birthDay"
                      name="birthDay"
                      value={formData.birthDay}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.birthDay ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">วัน</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day.toString()}>{day}</option>
                      ))}
                    </select>
                    {errors.birthDay && <p className="text-red-500 text-sm mt-1">{errors.birthDay}</p>}
                  </div>

                  <div>
                    <select
                      id="birthMonth"
                      name="birthMonth"
                      value={formData.birthMonth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.birthMonth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">เดือน</option>
                      <option value="1">มกราคม</option>
                      <option value="2">กุมภาพันธ์</option>
                      <option value="3">มีนาคม</option>
                      <option value="4">เมษายน</option>
                      <option value="5">พฤษภาคม</option>
                      <option value="6">มิถุนายน</option>
                      <option value="7">กรกฎาคม</option>
                      <option value="8">สิงหาคม</option>
                      <option value="9">กันยายน</option>
                      <option value="10">ตุลาคม</option>
                      <option value="11">พฤศจิกายน</option>
                      <option value="12">ธันวาคม</option>
                    </select>
                    {errors.birthMonth && <p className="text-red-500 text-sm mt-1">{errors.birthMonth}</p>}
                  </div>

                  <div>
                    <select
                      id="birthYear"
                      name="birthYear"
                      value={formData.birthYear}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.birthYear ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">ปี (พ.ศ.)</option>
                      {Array.from({ length: 100 }, (_, i) => {
                        const christianYear = new Date().getFullYear() - i;
                        const buddhistYear = christianYear + 543;
                        return { christianYear, buddhistYear };
                      }).map(({ christianYear, buddhistYear }) => (
                        <option key={christianYear} value={buddhistYear.toString()}>{buddhistYear}</option>
                      ))}
                    </select>
                    {errors.birthYear && <p className="text-red-500 text-sm mt-1">{errors.birthYear}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} />
                  เบอร์โทรศัพท์ *
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

            {/* Account Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Mail className="text-blue-600" size={20} />
                ข้อมูลบัญชี
              </h3>

              {/* Email Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมล *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    ยืนยันอีเมล *
                  </label>
                  <input
                    id="confirmEmail"
                    name="confirmEmail"
                    type="email"
                    value={formData.confirmEmail}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.confirmEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmEmail && <p className="text-red-500 text-sm mt-1">{errors.confirmEmail}</p>}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Lock size={16} />
                    รหัสผ่าน *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    ยืนยันรหัสผ่าน *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="flex items-center gap-2 mt-2 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm">รหัสผ่านตรงกัน</span>
                    </div>
                  )}
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
                    ฉันยอมรับ{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500 font-medium underline">
                      ข้อกำหนดและเงื่อนไขการใช้งาน
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && <p className="text-red-500 text-sm ml-7">{errors.acceptTerms}</p>}

                <div className="flex items-start">
                  <input
                    id="acceptPrivacy"
                    name="acceptPrivacy"
                    type="checkbox"
                    checked={formData.acceptPrivacy}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="acceptPrivacy" className="ml-3 text-sm text-gray-700">
                    ฉันยอมรับ{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500 font-medium underline">
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </label>
                </div>
                {errors.acceptPrivacy && <p className="text-red-500 text-sm ml-7">{errors.acceptPrivacy}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  สมัครสมาชิก
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            © 2024 HealthChain. สงวนลิขสิทธิ์ทั้งหมด.
          </p>
        </div>
      </div>
    </div>
  );
}
