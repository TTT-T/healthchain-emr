"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { logger } from '@/lib/logger';

interface PatientData {
  // Basic user info
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  
  // Patient specific info
  thai_name?: string;
  phone?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergency_contact_name?: string;
  national_id?: string;
  birth_date?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  gender?: string;
  occupation?: string;
  marital_status?: string;
  education?: string;
  
  // Additional fields from setup
  religion?: string;
  race?: string;
  blood_group?: string;
  blood_type?: string;
  weight?: string;
  height?: string;
  id_card_address?: string;
  current_address?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  drug_allergies?: string;
  food_allergies?: string;
  environment_allergies?: string;
  chronic_diseases?: string;
}

import EnhancedProfilePage from './EnhancedProfilePage';

export default function Profile() {
  return <EnhancedProfilePage />;
}

function OriginalProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<PatientData | null>(null);
  
  const [formData, setFormData] = useState<PatientData>({
    id: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    thai_name: '',
    phone: '',
    emergency_contact: undefined,
    national_id: '',
    birth_date: '',
    address: '',
    medical_history: '',
    allergies: '',
    medications: '',
    gender: '',
    occupation: '',
    marital_status: '',
    education: '',
    religion: '',
    race: '',
    blood_group: '',
    blood_type: '',
    weight: '',
    height: '',
    id_card_address: '',
    current_address: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    drug_allergies: '',
    food_allergies: '',
    environment_allergies: '',
    chronic_diseases: ''
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getProfile();
        
        if (response.statusCode === 200 && response.data) {
          const userData = response.data;
          setFormData(prev => ({
            ...prev,
            ...userData
          }));
          setOriginalData(userData as any); // Store original data for cancel functionality
        }
      } catch (error) {
        logger.error('Error loading user data:', error);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.email) {
        setError('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, นามสกุล, อีเมล)');
        return;
      }
      
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.(formData.email)) {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
        return;
      }
      
      // Phone validation (if provided)
      if (formData.phone && !/^[0-9\-\s\+\(\)]+$/.(formData.phone)) {
        setError('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
        return;
      }
      
      // National ID validation (if provided)
      if (formData.national_id && !/^[0-9]{13}$/.(formData.national_id.replace(/\D/g, ''))) {
        setError('เลขบัตรประชาชนต้องมี 13 หลัก');
        return;
      }
      
      // Transform data to match backend schema (camelCase)
      const transformedData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phoneNumber: formData.phone,
        emergencyContactName: formData.emergency_contact_name,
        emergencyContactPhone: formData.emergency_contact_phone,
        emergencyContactRelation: formData.emergency_contact_relation,
        profile_completed: true // Mark profile as completed when saving
      };
      
      const response = await apiClient.updateProfile(transformedData);
      
      if (response.statusCode === 200) {
        setSuccess('บันทึกข้อมูลสำเร็จ');
        setIsEditing(false);
        setOriginalData(formData); // Update original data after successful save
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError((response as any).message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      logger.error('Error saving profile:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'address', label: 'ที่อยู่', icon: '🏠' },
    { id: 'medical', label: 'ข้อมูลทางการแพทย์', icon: '🏥' },
    { id: 'emergency', label: 'ผู้ติดต่อฉุกเฉิน', icon: '🚨' },
    { id: 'settings', label: 'การตั้งค่า', icon: '⚙️' }
  ];

  if (isLoading) {
    return (
      <AppLayout title="ข้อมูลส่วนตัว" userType="patient">
        <div className="bg-slate-50 min-h-screen p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ข้อมูลส่วนตัว" userType="patient">
      <div className="bg-slate-50 min-h-screen p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl md:text-3xl">
                    {formData.first_name?.[0] || 'U'}{formData.last_name?.[0] || 'N'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
                  {formData.thai_name || `${formData.first_name} ${formData.last_name}`}
                </h2>
                <div className="space-y-2 text-sm md:text-base text-slate-600">
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-lg">📧</span>
                    <span className="break-all">{formData.email}</span>
                  </p>
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-lg">📞</span>
                    {formData.phone || formData.phone_number || 'ไม่ระบุ'}
                  </p>
                  {formData.blood_group && formData.blood_type && (
                    <p className="flex items-center justify-center md:justify-start gap-2">
                      <span className="text-lg">🩸</span>
                      หมู่เลือด {formData.blood_group}{formData.blood_type}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                  className={`px-6 py-3 text-sm md:text-base font-medium rounded-xl transition-all disabled:opacity-50 ${
                    isEditing 
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl" 
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isSaving ? "กำลังบันทึก..." : isEditing ? "บันทึก" : "แก้ไข"}
                </button>
                
                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 text-sm md:text-base font-medium rounded-xl transition-all bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ข้อมูลส่วนตัว</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อ (อังกฤษ)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.first_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">นามสกุล (อังกฤษ)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.last_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อ-นามสกุล (ไทย)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="thai_name"
                          value={formData.thai_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.thai_name || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ใช้</label>
                      <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">{formData.username}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">อีเมล</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.phone || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">วันเกิด</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="birth_date"
                          value={formData.birth_date || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">
                          {formData.birth_date ? (
                            <span>
                              {new Date(formData.birth_date).toLocaleDaring('th-TH')}
                              {(() => {
                                const birthDate = new Date(formData.birth_date);
                                const today = new Date();
                                const age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                                return ` (อายุ ${adjustedAge} ปี)`;
                              })()}
                            </span>
                          ) : 'ไม่ระบุ'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เลขบัตรประชาชน</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="national_id"
                          value={formData.national_id || ''}
                          onChange={handleInputChange}
                          maxLength={13}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="เลขบัตรประชาชน 13 หลัก"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.national_id || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เพศ</label>
                      {isEditing ? (
                        <select
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกเพศ</option>
                          <option value="male">ชาย</option>
                          <option value="female">หญิง</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">
                          {formData.gender === 'male' ? 'ชาย' : 
                           formData.gender === 'female' ? 'หญิง' : 
                           formData.gender === 'other' ? 'อื่นๆ' : 'ไม่ระบุ'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ศาสนา</label>
                      {isEditing ? (
                        <select
                          name="religion"
                          value={formData.religion || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกศาสนา</option>
                          <option value="พุทธ">พุทธ</option>
                          <option value="อิสลาม">อิสลาม</option>
                          <option value="คริสต์">คริสต์</option>
                          <option value="ฮินดู">ฮินดู</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">{formData.religion || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เชื้อชาติ</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="race"
                          value={formData.race || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.race || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">อาชีพ</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="occupation"
                          value={formData.occupation || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="อาชีพ"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.occupation || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">สถานะสมรส</label>
                      {isEditing ? (
                        <select
                          name="marital_status"
                          value={formData.marital_status || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกสถานะ</option>
                          <option value="single">โสด</option>
                          <option value="married">สมรส</option>
                          <option value="divorced">หย่าร้าง</option>
                          <option value="widowed">หม้าย</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">
                          {formData.marital_status === 'single' ? 'โสด' : 
                           formData.marital_status === 'married' ? 'สมรส' : 
                           formData.marital_status === 'divorced' ? 'หย่าร้าง' : 
                           formData.marital_status === 'widowed' ? 'หม้าย' : 'ไม่ระบุ'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">การศึกษา</label>
                      {isEditing ? (
                        <select
                          name="education"
                          value={formData.education || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกระดับการศึกษา</option>
                          <option value="ประถมศึกษา">ประถมศึกษา</option>
                          <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                          <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                          <option value="อนุปริญญา">อนุปริญญา</option>
                          <option value="ปริญญาตรี">ปริญญาตรี</option>
                          <option value="ปริญญาโท">ปริญญาโท</option>
                          <option value="ปริญญาเอก">ปริญญาเอก</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">{formData.education || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ข้อมูลที่อยู่</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">ที่อยู่ตามบัตรประชาชน</h4>
                      {isEditing ? (
                        <textarea
                          name="id_card_address"
                          value={formData.id_card_address || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ที่อยู่ตามบัตรประชาชน"
                        />
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.id_card_address || 'ไม่ระบุ'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">ที่อยู่ปัจจุบัน</h4>
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            name="current_address"
                            value={formData.current_address || formData.address || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ที่อยู่ปัจจุบัน"
                          />
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    current_address: prev.id_card_address || ''
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            ใช้ที่อยู่เดียวกับบัตรประชาชน
                          </label>
                        </div>
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.current_address || formData.address || 'ไม่ระบุ'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Information Tab */}
              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ข้อมูลทางการแพทย์</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">หมู่เลือด</label>
                      {isEditing ? (
                        <select
                          name="blood_group"
                          value={formData.blood_group || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกหมู่เลือด</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">{formData.blood_group || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทเลือด</label>
                      {isEditing ? (
                        <select
                          name="blood_type"
                          value={formData.blood_type || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกประเภท</option>
                          <option value="+">+</option>
                          <option value="-">-</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">{formData.blood_type || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">น้ำหนัก (กิโลกรัม)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="น้ำหนัก"
                          min="0"
                          step="0.1"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.weight ? `${formData.weight} กก.` : 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ส่วนสูง (เซนติเมตร)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="height"
                          value={formData.height || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ส่วนสูง"
                          min="0"
                          step="0.1"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">
                          {formData.height ? `${formData.height} ซม.` : 'ไม่ระบุ'}
                          {formData.height && formData.weight && (
                            <span className="text-sm text-slate-500 ml-2">
                              (BMI: {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">การแพ้ยา</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            name="drug_allergies"
                            value={formData.drug_allergies || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ระบุรายการยาที่แพ้ (ถ้าไม่มีให้ใส่ 'ไม่มี')"
                          />
                          <p className="text-xs text-slate-500">
                            กรุณาระบุชื่อยาที่แพ้อย่างชัดเจน เช่น Penicillin, Aspirin หรือใส่ &quot;ไม่มี&quot; หากไม่แพ้
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.drug_allergies || formData.allergies || 'ไม่มี'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">การแพ้อาหาร</label>
                      {isEditing ? (
                        <textarea
                          name="food_allergies"
                          value={formData.food_allergies || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ระบุรายการอาหารที่แพ้"
                        />
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.food_allergies || 'ไม่มี'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">การแพ้สิ่งแวดล้อม</label>
                      {isEditing ? (
                        <textarea
                          name="environment_allergies"
                          value={formData.environment_allergies || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ระบุสิ่งแวดล้อมที่แพ้"
                        />
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.environment_allergies || 'ไม่มี'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">โรคประจำตัว</label>
                      {isEditing ? (
                        <textarea
                          name="chronic_diseases"
                          value={formData.chronic_diseases || formData.medical_history || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ระบุโรคประจำตัวหรือประวัติการรักษา"
                        />
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.chronic_diseases || formData.medical_history || 'ไม่มี'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ยาที่ใช้ประจำ</label>
                      {isEditing ? (
                        <textarea
                          name="medications"
                          value={formData.medications || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ระบุยาที่ใช้ประจำ"
                        />
                      ) : (
                        <p className="text-slate-800 py-2 bg-slate-50 px-3 rounded-lg">
                          {formData.medications || 'ไม่มี'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ผู้ติดต่อฉุกเฉิน</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ติดต่อ</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="emergency_contact"
                          value={typeof formData.emergency_contact === 'string' ? formData.emergency_contact : formData.emergency_contact?.name || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{typeof formData.emergency_contact === 'string' ? formData.emergency_contact : formData.emergency_contact?.name || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 py-2">{formData.emergency_contact_phone || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">ความสัมพันธ์</label>
                      {isEditing ? (
                        <select
                          name="emergency_contact_relation"
                          value={formData.emergency_contact_relation || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกความสัมพันธ์</option>
                          <option value="บิดา">บิดา</option>
                          <option value="มารดา">มารดา</option>
                          <option value="สามี">สามี</option>
                          <option value="ภรรยา">ภรรยา</option>
                          <option value="บุตร">บุตร</option>
                          <option value="พี่น้อง">พี่น้อง</option>
                          <option value="เพื่อน">เพื่อน</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      ) : (
                        <p className="text-slate-800 py-2">{formData.emergency_contact_relation || 'ไม่ระบุ'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">การตั้งค่าบัญชี</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-700">ความปลอดภัย</h4>
                      <Link
                        href="/accounts/change-password"
                        className="w-full text-left px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">เปลี่ยนรหัสผ่าน</span>
                          <span className="text-slate-400">→</span>
                        </div>
                      </Link>
                      <Link
                        href="/accounts/security-settings"
                        className="w-full text-left px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">การตั้งค่าความปลอดภัย</span>
                          <span className="text-slate-400">→</span>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-700">การแจ้งเตือน</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">การแจ้งเตือนทางอีเมล</span>
                          <input type="checkbox" defaultChecked className="rounded" disabled={!isEditing} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">การแจ้งเตือนทาง SMS</span>
                          <input type="checkbox" className="rounded" disabled={!isEditing} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">การแจ้งเตือนการนัดหมาย</span>
                          <input type="checkbox" defaultChecked className="rounded" disabled={!isEditing} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
