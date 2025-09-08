"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Stethoscope, 
  UserPlus, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Heart,
  Shield,
  Users
} from 'lucide-react';

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number' | 'password';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  required = false,
  placeholder,
  min,
  max,
  maxLength,
  error
}) => {
  if (type === 'select') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={`h-10 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${error ? 'border-red-500' : ''}`}>
            <SelectValue placeholder={placeholder || `เลือก${label}`} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)} className="hover:bg-gray-100 focus:bg-gray-100">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <div className="text-sm text-red-600 flex items-center gap-1">
            <span className="text-red-500">⚠</span>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors"
          placeholder={placeholder}
          rows={3}
          required={required}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        required={required}
        className={`h-10 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error}
        </div>
      )}
    </div>
  );
};

interface MedicalStaffRegistrationFormData {
  // Personal Information
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
  
  // Contact Information
  email: string;
  confirmEmail: string;
  phone: string;
  
  // Professional Information
  profession: string; // doctor, nurse, staff
  medicalLicenseNumber: string;
  specialization: string;
  department: string;
  experience: string;
  
  // Login Credentials
  username: string;
  password: string;
  confirmPassword: string;
  
  // Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const professionOptions = [
  { value: 'doctor', label: 'แพทย์' },
  { value: 'nurse', label: 'พยาบาล' },
  { value: 'staff', label: 'เจ้าหน้าที่' }
];

const titlePrefixOptions = [
  { value: 'นพ.', label: 'นพ.' },
  { value: 'พญ.', label: 'พญ.' },
  { value: 'ทพ.', label: 'ทพ.' },
  { value: 'ทญ.', label: 'ทญ.' },
  { value: 'ภก.', label: 'ภก.' },
  { value: 'ภญ.', label: 'ภญ.' },
  { value: 'นาง', label: 'นาง' },
  { value: 'นางสาว', label: 'นางสาว' },
  { value: 'นาย', label: 'นาย' }
];

const departmentOptions = [
  { value: 'internal_medicine', label: 'อายุรกรรม' },
  { value: 'surgery', label: 'ศัลยกรรม' },
  { value: 'pediatrics', label: 'กุมารเวชกรรม' },
  { value: 'obstetrics_gynecology', label: 'สูติ-นรีเวชกรรม' },
  { value: 'emergency', label: 'เวชศาสตร์ฉุกเฉิน' },
  { value: 'radiology', label: 'รังสีวิทยา' },
  { value: 'pathology', label: 'พยาธิวิทยา' },
  { value: 'anesthesiology', label: 'วิสัญญีวิทยา' },
  { value: 'cardiology', label: 'โรคหัวใจ' },
  { value: 'neurology', label: 'ประสาทวิทยา' },
  { value: 'orthopedics', label: 'ออร์โธปิดิกส์' },
  { value: 'dermatology', label: 'ผิวหนัง' },
  { value: 'ophthalmology', label: 'จักษุวิทยา' },
  { value: 'otolaryngology', label: 'หู คอ จมูก' },
  { value: 'psychiatry', label: 'จิตเวชศาสตร์' },
  { value: 'nursing', label: 'พยาบาล' },
  { value: 'pharmacy', label: 'เภสัชกรรม' },
  { value: 'laboratory', label: 'ห้องปฏิบัติการ' },
  { value: 'administration', label: 'บริหาร' },
  { value: 'other', label: 'อื่นๆ' }
];

export default function MedicalStaffRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState<MedicalStaffRegistrationFormData>({
    // Personal Information
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
    
    // Contact Information
    email: '',
    confirmEmail: '',
    phone: '',
    
    // Professional Information
    profession: '',
    medicalLicenseNumber: '',
    specialization: '',
    department: '',
    experience: '',
    
    // Login Credentials
    username: '',
    password: '',
    confirmPassword: '',
    
    // Terms
    acceptTerms: false,
    acceptPrivacy: false
  });

  const validateField = (field: keyof MedicalStaffRegistrationFormData, value: string): string => {
    switch (field) {
      case 'nationalId':
        if (value && !/^\d{13}$/.test(value)) {
          return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น';
        }
        break;
      case 'phone':
        if (value && !/^[0-9]{10}$/.test(value.replace(/[-\s]/g, ''))) {
          return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
        }
        break;
      case 'username':
        if (value && !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
          return 'ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข หรือ _ อย่างน้อย 3 ตัวอักษร';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        break;
      case 'firstName':
      case 'lastName':
        if (value && value.trim() === '') {
          return 'กรุณากรอกข้อมูลให้ครบถ้วน';
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        }
        break;
      case 'confirmPassword':
        if (value && formData.password && value !== formData.password) {
          return 'รหัสผ่านไม่ตรงกัน';
        }
        break;
      case 'confirmEmail':
        if (value && formData.email && value !== formData.email) {
          return 'อีเมลไม่ตรงกัน';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: keyof MedicalStaffRegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time field validation for string fields
    if (typeof value === 'string') {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    // Clear registration result when user starts typing
    if (registrationResult) {
      setRegistrationResult(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.titlePrefix) errors.push('กรุณาเลือกคำนำหน้า');
    if (!formData.firstName || formData.firstName.trim() === '') errors.push('กรุณากรอกชื่อ');
    if (!formData.lastName || formData.lastName.trim() === '') errors.push('กรุณากรอกนามสกุล');
    if (!formData.email || formData.email.trim() === '') errors.push('กรุณากรอกอีเมล');
    if (!formData.confirmEmail || formData.confirmEmail.trim() === '') errors.push('กรุณายืนยันอีเมล');
    if (!formData.phone || formData.phone.trim() === '') errors.push('กรุณากรอกเบอร์โทรศัพท์');
    if (!formData.nationalId || formData.nationalId.trim() === '') errors.push('กรุณากรอกเลขบัตรประชาชน');
    if (!formData.birthDay) errors.push('กรุณาเลือกวันเกิด');
    if (!formData.birthMonth) errors.push('กรุณาเลือกเดือนเกิด');
    if (!formData.birthYear) errors.push('กรุณาเลือกปีเกิด');
    if (!formData.gender) errors.push('กรุณาเลือกเพศ');
    if (!formData.profession) errors.push('กรุณาเลือกอาชีพ');
    if (!formData.medicalLicenseNumber || formData.medicalLicenseNumber.trim() === '') errors.push('กรุณากรอกหมายเลขใบอนุญาต/ใบประกอบวิชาชีพ');
    if (!formData.specialization || formData.specialization.trim() === '') errors.push('กรุณากรอกสาขาวิชาเฉพาะ/ความเชี่ยวชาญ');
    if (!formData.department) errors.push('กรุณาเลือกแผนก');
    if (!formData.username || formData.username.trim() === '') errors.push('กรุณากรอกชื่อผู้ใช้');
    if (!formData.password || formData.password.trim() === '') errors.push('กรุณากรอกรหัสผ่าน');
    if (!formData.confirmPassword || formData.confirmPassword.trim() === '') errors.push('กรุณายืนยันรหัสผ่าน');

    // National ID validation
    if (formData.nationalId && !/^\d{13}$/.test(formData.nationalId)) {
      errors.push('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น');
    }

    // Phone validation
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
    }

    // Username validation
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      errors.push('ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข หรือ _ อย่างน้อย 3 ตัวอักษร');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }

    // Email confirmation
    if (formData.email !== formData.confirmEmail) {
      errors.push('อีเมลไม่ตรงกัน');
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.push('รหัสผ่านไม่ตรงกัน');
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.push('กรุณายอมรับข้อกำหนดและเงื่อนไข');
    }
    if (!formData.acceptPrivacy) {
      errors.push('กรุณายอมรับนโยบายความเป็นส่วนตัว');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setRegistrationResult({
        success: false,
        message: 'กรุณาตรวจสอบข้อมูลที่กรอก:\n' + errors.join('\n')
      });
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setRegistrationResult(null);

    try {
      // Convert Buddhist Era to Christian Era
      const christianYear = parseInt(formData.birthYear) - 543;
      const birthDate = `${christianYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;

      const response = await fetch('/api/medical-staff/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          birthDate,
          role: formData.profession
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response text:', textResponse);
        result = { error: 'Invalid JSON response', rawResponse: textResponse };
      }
      
      console.log('API Response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        result: result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'null/undefined'
      });
      
      if (response.ok && result && result.success) {
        console.log('Registration successful:', result);
        setRegistrationResult({
          success: true,
          message: result.message || 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี และรอการอนุมัติจาก admin'
        });
        
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          window.location.href = `/register/success?email=${encodeURIComponent(formData.email)}&verification=true&adminApproval=true&type=${formData.profession}`;
        }, 3000);
      } else {
        console.error('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          result: result,
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : 'null/undefined'
        });
        let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
        
        // Try to get error message from different possible sources
        if (result && typeof result === 'object') {
          if (result.error && result.error.message) {
            errorMessage = result.error.message;
          } else if (result.message) {
            errorMessage = result.message;
          } else if (result.error) {
            errorMessage = result.error;
          } else if (result.details) {
            errorMessage = result.details;
          } else if (result.issues && Array.isArray(result.issues)) {
            // Handle Zod validation errors
            errorMessage = result.issues.map((issue: any) => issue.message).join(', ');
          }
        }
        
        // Handle specific error messages
        if (errorMessage.includes('Email already exists') || errorMessage.includes('email')) {
          errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
        } else if (errorMessage.includes('Username already exists') || errorMessage.includes('username')) {
          errorMessage = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาใช้ชื่อผู้ใช้อื่น';
        } else if (errorMessage.includes('medical_license_number') || errorMessage.includes('license')) {
          errorMessage = 'หมายเลขใบอนุญาตนี้ถูกใช้งานแล้ว กรุณาใช้หมายเลขอื่น';
        } else if (errorMessage.includes('national_id') || errorMessage.includes('National ID')) {
          errorMessage = 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาใช้เลขบัตรประชาชนอื่น';
        }
        
        // Fallback to status-based messages
        if (response.status === 409) {
          errorMessage = 'ข้อมูลนี้ถูกใช้งานแล้ว กรุณาใช้ข้อมูลอื่น';
        } else if (response.status === 400) {
          errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่';
        } else if (response.status === 500) {
          errorMessage = 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
        }
        
        setRegistrationResult({
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Medical staff registration error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setRegistrationResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProfessionIcon = (profession: string) => {
    switch (profession) {
      case 'doctor':
        return <Stethoscope className="h-6 w-6 text-emerald-600" />;
      case 'nurse':
        return <Heart className="h-6 w-6 text-pink-600" />;
      case 'staff':
        return <Users className="h-6 w-6 text-blue-600" />;
      default:
        return <UserPlus className="h-6 w-6 text-gray-600" />;
    }
  };

  const getProfessionLabel = (profession: string) => {
    switch (profession) {
      case 'doctor':
        return 'แพทย์';
      case 'nurse':
        return 'พยาบาล';
      case 'staff':
        return 'เจ้าหน้าที่';
      default:
        return 'บุคลากรทางการแพทย์';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าแรก
            </Link>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ระบบ EMR</h1>
          <p className="text-xl text-gray-600">สมัครสมาชิกบุคลากรทางการแพทย์</p>
        </div>

        {/* Registration Form */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                {getProfessionIcon(formData.profession)}
                สมัครสมาชิก{getProfessionLabel(formData.profession)}
              </CardTitle>
              <CardDescription className="text-emerald-100 text-center mt-2">
                กรอกข้อมูลเพื่อสมัครสมาชิกบุคลากรทางการแพทย์
              </CardDescription>
            </div>

            {/* Development helper */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-8 py-4 bg-yellow-50 border-b border-yellow-200">
                <p className="text-sm text-yellow-700 mb-3">Development Mode - Quick Fill:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const timestamp = Date.now();
                      setFormData({
                        // Personal Information
                        titlePrefix: 'นาย',
                        firstName: 'สมชาย',
                        lastName: 'ใจดี',
                        firstNameEn: 'Somchai',
                        lastNameEn: 'Jaidee',
                        nationalId: `1234567890${timestamp.toString().slice(-3)}`,
                        birthDay: '15',
                        birthMonth: '2',
                        birthYear: '2533',
                        gender: 'male',
                        
                        // Contact Information
                        email: `dr.somchai${timestamp}@hospital.com`,
                        confirmEmail: `dr.somchai${timestamp}@hospital.com`,
                        phone: '0812345678',
                        
                        // Professional Information
                        profession: 'doctor',
                        medicalLicenseNumber: `MD${timestamp.toString().slice(-8)}`,
                        specialization: 'อายุรกรรม',
                        department: 'internal_medicine',
                        experience: '5',
                        
                        // Login Credentials
                        username: `dr_somchai_${timestamp.toString().slice(-4)}`,
                        password: 'SecurePass123!',
                        confirmPassword: 'SecurePass123!',
                        
                        // Terms
                        acceptTerms: true,
                        acceptPrivacy: true
                      });
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  >
                    👨‍⚕️ แพทย์
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const timestamp = Date.now();
                      setFormData({
                        // Personal Information
                        titlePrefix: 'นางสาว',
                        firstName: 'สมหญิง',
                        lastName: 'ใจงาม',
                        firstNameEn: 'Somying',
                        lastNameEn: 'Jainam',
                        nationalId: `1234567890${(timestamp + 1).toString().slice(-3)}`,
                        birthDay: '20',
                        birthMonth: '5',
                        birthYear: '2535',
                        gender: 'female',
                        
                        // Contact Information
                        email: `nurse.somying${timestamp}@hospital.com`,
                        confirmEmail: `nurse.somying${timestamp}@hospital.com`,
                        phone: '0812345679',
                        
                        // Professional Information
                        profession: 'nurse',
                        medicalLicenseNumber: `RN${(timestamp + 1).toString().slice(-8)}`,
                        specialization: 'พยาบาลเวชปฏิบัติ',
                        department: 'internal_medicine',
                        experience: '3',
                        
                        // Login Credentials
                        username: `nurse_somying_${timestamp.toString().slice(-4)}`,
                        password: 'SecurePass123!',
                        confirmPassword: 'SecurePass123!',
                        
                        // Terms
                        acceptTerms: true,
                        acceptPrivacy: true
                      });
                    }}
                    className="px-3 py-1 bg-pink-600 text-white text-xs rounded hover:bg-pink-700 transition-colors"
                  >
                    👩‍⚕️ พยาบาล
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const timestamp = Date.now();
                      setFormData({
                        // Personal Information
                        titlePrefix: 'นาย',
                        firstName: 'สมศักดิ์',
                        lastName: 'ใจดี',
                        firstNameEn: 'Somsak',
                        lastNameEn: 'Jaidee',
                        nationalId: `1234567890${(timestamp + 2).toString().slice(-3)}`,
                        birthDay: '10',
                        birthMonth: '8',
                        birthYear: '2530',
                        gender: 'male',
                        
                        // Contact Information
                        email: `staff.somsak${timestamp}@hospital.com`,
                        confirmEmail: `staff.somsak${timestamp}@hospital.com`,
                        phone: '0812345680',
                        
                        // Professional Information
                        profession: 'staff',
                        medicalLicenseNumber: `ST${(timestamp + 2).toString().slice(-8)}`,
                        specialization: 'เจ้าหน้าที่บริหาร',
                        department: 'internal_medicine',
                        experience: '2',
                        
                        // Login Credentials
                        username: `staff_somsak_${timestamp.toString().slice(-4)}`,
                        password: 'SecurePass123!',
                        confirmPassword: 'SecurePass123!',
                        
                        // Terms
                        acceptTerms: true,
                        acceptPrivacy: true
                      });
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    👨‍💼 เจ้าหน้าที่
                  </button>
                </div>
              </div>
            )}
          
            {/* Registration Result Alert */}
                {registrationResult && (
                  <div className="px-8 py-4">
                    <Alert className={`border-0 ${registrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <div className="flex items-center gap-2">
                        {registrationResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <AlertDescription className="font-medium whitespace-pre-line">
                          {registrationResult.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                    {registrationResult.success && (
                      <div className="px-8 py-2">
                        <p className="text-sm text-green-700 text-center">
                          กำลังนำคุณไปยังหน้าสำเร็จ... กรุณารอสักครู่
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="px-8 py-4">
                    <Alert className="border-0 bg-red-50 text-red-800">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <AlertDescription className="font-medium mb-2">
                            กรุณาแก้ไขข้อมูลต่อไปนี้:
                          </AlertDescription>
                          <ul className="text-sm space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="text-red-600">•</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}
            
            <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Professional Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลวิชาชีพ</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    label="อาชีพ *"
                    value={formData.profession}
                    onChange={(value) => handleInputChange('profession', value)}
                    type="select"
                    options={professionOptions}
                    required
                  />
                  
                  <FormField
                    label="หมายเลขใบอนุญาต *"
                    value={formData.medicalLicenseNumber}
                    onChange={(value) => handleInputChange('medicalLicenseNumber', value)}
                    placeholder="MD123456"
                    required
                  />
                  
                  <FormField
                    label="แผนก *"
                    value={formData.department}
                    onChange={(value) => handleInputChange('department', value)}
                    type="select"
                    options={departmentOptions}
                    required
                  />
                  
                  <FormField
                    label="สาขาวิชาเฉพาะ *"
                    value={formData.specialization}
                    onChange={(value) => handleInputChange('specialization', value)}
                    placeholder="อายุรกรรม"
                    required
                  />
                  
                  <FormField
                    label="ประสบการณ์ (ปี)"
                    value={formData.experience}
                    onChange={(value) => handleInputChange('experience', value)}
                    type="number"
                    placeholder="0"
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    label="คำนำหน้า *"
                    value={formData.titlePrefix}
                    onChange={(value) => handleInputChange('titlePrefix', value)}
                    type="select"
                    options={titlePrefixOptions}
                    required
                  />

                  <FormField
                    label="ชื่อ (ไทย) *"
                    value={formData.firstName}
                    onChange={(value) => handleInputChange('firstName', value)}
                    placeholder="สมชาย"
                    required
                    error={fieldErrors.firstName}
                  />

                  <FormField
                    label="นามสกุล (ไทย) *"
                    value={formData.lastName}
                    onChange={(value) => handleInputChange('lastName', value)}
                    placeholder="ใจดี"
                    required
                    error={fieldErrors.lastName}
                  />

                  <FormField
                    label="ชื่อ (อังกฤษ)"
                    value={formData.firstNameEn}
                    onChange={(value) => handleInputChange('firstNameEn', value)}
                    placeholder="Somchai"
                  />

                  <FormField
                    label="นามสกุล (อังกฤษ)"
                    value={formData.lastNameEn}
                    onChange={(value) => handleInputChange('lastNameEn', value)}
                    placeholder="Jaidee"
                  />

                  <FormField
                    label="เพศ *"
                    value={formData.gender}
                    onChange={(value) => handleInputChange('gender', value)}
                    type="select"
                    options={[
                      { value: 'male', label: 'ชาย' },
                      { value: 'female', label: 'หญิง' },
                      { value: 'other', label: 'อื่นๆ' }
                    ]}
                    required
                  />
                </div>

                {/* Birth Date and National ID - Separate Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="เลขบัตรประชาชน *"
                    value={formData.nationalId}
                    onChange={(value) => handleInputChange('nationalId', value)}
                    placeholder="1234567890123"
                    maxLength={13}
                    required
                    error={fieldErrors.nationalId}
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">วัน เดือน ปี เกิด *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={formData.birthDay}
                          onChange={(e) => handleInputChange('birthDay', e.target.value)}
                          placeholder="15"
                          min="1"
                          max="31"
                          className="h-10 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <Select value={formData.birthMonth} onValueChange={(value) => handleInputChange('birthMonth', value)}>
                          <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                            <SelectValue placeholder="เลือกเดือน" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {[
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
                            ].map((month) => (
                              <SelectItem key={month.value} value={String(month.value)} className="hover:bg-gray-100 focus:bg-gray-100">
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={formData.birthYear}
                          onChange={(e) => handleInputChange('birthYear', e.target.value)}
                          placeholder="2533"
                          min="2400"
                          max="2700"
                          className="h-10 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลติดต่อ</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="อีเมล *"
                    value={formData.email}
                    onChange={(value) => handleInputChange('email', value)}
                    type="email"
                    placeholder="dr.somchai@hospital.com"
                    required
                    error={fieldErrors.email}
                  />
                  
                  <FormField
                    label="ยืนยันอีเมล *"
                    value={formData.confirmEmail}
                    onChange={(value) => handleInputChange('confirmEmail', value)}
                    type="email"
                    placeholder="dr.somchai@hospital.com"
                    required
                    error={fieldErrors.confirmEmail}
                  />
                  
                  <FormField
                    label="เบอร์โทรศัพท์ *"
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    type="tel"
                    placeholder="0812345678"
                    required
                    error={fieldErrors.phone}
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลเข้าสู่ระบบ</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="ชื่อผู้ใช้ *"
                    value={formData.username}
                    onChange={(value) => handleInputChange('username', value)}
                    placeholder="dr_somchai"
                    required
                    error={fieldErrors.username}
                  />
                  
                  <FormField
                    label="รหัสผ่าน *"
                    value={formData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    type="password"
                    placeholder="SecurePass123!"
                    required
                    error={fieldErrors.password}
                  />
                  
                  <FormField
                    label="ยืนยันรหัสผ่าน *"
                    value={formData.confirmPassword}
                    onChange={(value) => handleInputChange('confirmPassword', value)}
                    type="password"
                    placeholder="SecurePass123!"
                    required
                    error={fieldErrors.confirmPassword}
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ข้อกำหนดและเงื่อนไข</h3>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      required
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      ฉันยอมรับ <Link href="/terms" className="text-emerald-600 hover:underline font-medium">ข้อกำหนดและเงื่อนไข</Link> ของการใช้งานระบบ EMR
                    </span>
                  </label>
                  
                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.acceptPrivacy}
                      onChange={(e) => handleInputChange('acceptPrivacy', e.target.checked)}
                      className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      required
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      ฉันยอมรับ <Link href="/privacy" className="text-emerald-600 hover:underline font-medium">นโยบายความเป็นส่วนตัว</Link> และการประมวลผลข้อมูลส่วนบุคคล
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  กลับ
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      กำลังสมัครสมาชิก...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      สมัครสมาชิก
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            มีบัญชีแล้ว?{' '}
            <Link href="/doctor/login" className="text-emerald-600 hover:underline font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
