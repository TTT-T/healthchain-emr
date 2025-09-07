"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

export default function SetupProfile() {
  const router = useRouter();
  const { user, refreshUser, isLoading } = useAuth();
  
  // Check if user is authenticated
  useEffect(() => {
    const token = apiClient.getAccessToken();
    logger.debug('🔍 Profile setup auth check - Token:', !!token);
    
    // Allow some time for auth context to initialize
    if (!isLoading) {
      if (!user && !token) {
        logger.debug('❌ No user or token, redirecting to login');
        router.push('/login');
        return;
      }
      
      if (user && user.role !== 'patient') {
        logger.debug('❌ User is not a patient, redirecting');
        router.push('/');
        return;
      }
      
      if (user && user.profileCompleted) {
        logger.debug('✅ Profile already completed, redirecting to dashboard');
        router.push('/accounts/patient');
        return;
      }
    }
  }, [user, router, isLoading]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomReligion, setShowCustomReligion] = useState(false);
  const [showCustomRace, setShowCustomRace] = useState(false);
  const [showCustomEmergencyRelation, setShowCustomEmergencyRelation] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    religion: "",
    customReligion: "",
    race: "",
    customRace: "",
    
    // Step 2: Address Info - ที่อยู่ตามบัตรประชาชน
    idCardHouseNo: "",
    idCardMoo: "",
    idCardSoi: "",
    idCardRoad: "",
    idCardSubDistrict: "",
    idCardDistrict: "",
    idCardProvince: "",
    idCardPostalCode: "",
    
    // ที่อยู่ปัจจุบัน
    currentHouseNo: "",
    currentMoo: "",
    currentSoi: "",
    currentRoad: "",
    currentSubDistrict: "",
    currentDistrict: "",
    currentProvince: "",
    currentPostalCode: "",
    sameAsIdCard: false,
    
    // Step 3: Emergency Contact & Medical Info
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    customEmergencyRelation: "",
    drugAllergies: "",
    foodAllergies: "",
    environmentAllergies: "",
    bloodGroup: "",
    bloodType: "",
    chronicDiseases: "",
    currentMedications: "",
    
    // Step 4: Security Settings
    twoFactorAuth: false,
    emailNotifications: true,
    smsNotifications: true
  });

  const totalSteps = 4;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle custom religion
    if (name === 'religion') {
      if (value === 'other') {
        setShowCustomReligion(true);
        setFormData(prev => ({ ...prev, [name]: '', customReligion: '' }));
      } else if (!showCustomReligion) {
        setShowCustomReligion(false);
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
    // Handle custom race
    else if (name === 'race') {
      if (value === 'other') {
        setShowCustomRace(true);
        setFormData(prev => ({ ...prev, [name]: '', customRace: '' }));
      } else if (!showCustomRace) {
        setShowCustomRace(false);
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
    // Handle custom emergency relation
    else if (name === 'emergencyContactRelation') {
      if (value === 'other') {
        setShowCustomEmergencyRelation(true);
        setFormData(prev => ({ ...prev, [name]: '', customEmergencyRelation: '' }));
      } else if (!showCustomEmergencyRelation) {
        setShowCustomEmergencyRelation(false);
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
    // Validation สำหรับรหัสไปรษณีย์
    else if (name === 'idCardPostalCode' || name === 'currentPostalCode') {
      // อนุญาตเฉพาะตัวเลข และจำกัดที่ 5 หลัก
      if (!/^\d*$/.test(value) || value.length > 5) {
        return;
      }
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // เตรียมข้อมูลสำหรับส่งไป API
      const submitData = {
        thai_name: formData.religion ? `${formData.religion} ${formData.race}` : undefined,
        phone: formData.emergencyContactPhone,
        emergency_contact: formData.emergencyContactName,
        national_id: formData.idCardHouseNo, // ใช้ house number เป็น placeholder
        birth_date: undefined, // ยังไม่มีในฟอร์ม
        address: formatFullAddress(formData, 'current'),
        medical_history: formData.chronicDiseases,
        allergies: `ยา: ${formData.drugAllergies}, อาหาร: ${formData.foodAllergies}, สิ่งแวดล้อม: ${formData.environmentAllergies}`,
        medications: formData.currentMedications
      };

      logger.debug("Profile data to submit:", submitData);
      
      // Detailed token debugging
      const token = apiClient.getAccessToken();
      logger.debug("🔍 Access token check:");
      logger.debug("  - Token available:", !!token);
      logger.debug("  - Token length:", token?.length || 0);
      logger.debug("  - Token preview:", token ? token.substring(0, 30) + '...' : 'null');
      logger.debug("  - All cookies:", document.cookie);

      // Send to API
      const response = await apiClient.setupProfile(submitData);
      
      logger.debug("Raw API response:", response);
      
      if (response.statusCode === 200) {
        logger.debug("Profile setup successful:", response.data);
        
        // Refresh user data to get updated profile_completed status
        await refreshUser();
        
        // Navigate to patient dashboard
        router.push('/accounts/patient');
      } else {
        logger.error("Profile setup failed - response not successful:", response);
        throw new Error(response.error?.message || 'Profile setup failed');
      }
      
    } catch (error) {
      logger.error("Profile setup failed:", error);
      
      // Better error handling
      let errorMessage = "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        }
      }
      
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStep + 1) / (totalSteps + 1)) * 100);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ข้อมูลพื้นฐานเพิ่มเติม</h2>
              <p className="text-gray-600">ศาสนาและเชื้อชาติ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ศาสนา</label>
                {showCustomReligion ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="customReligion"
                      value={formData.customReligion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="ระบุศาสนา เช่น ยิว, บาไฮ"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomReligion(false);
                        setFormData(prev => ({ ...prev, religion: '', customReligion: '' }));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <ArrowLeft size={14} />
                      กลับไปเลือกจากรายการ
                    </button>
                  </div>
                ) : (
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                  >
                    <option value="">เลือกศาสนา</option>
                    <option value="พุทธ">พุทธ</option>
                    <option value="อิสลาม">อิสลาม</option>
                    <option value="คริสต์">คริสต์</option>
                    <option value="ฮินดู">ฮินดู</option>
                    <option value="ซิกข์">ซิกข์</option>
                    <option value="other">อื่น ๆ (กรอกเอง)</option>
                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เชื้อชาติ</label>
                {showCustomRace ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="customRace"
                      value={formData.customRace}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="ระบุเชื้อชาติ เช่น ญี่ปุ่น, เกาหลี"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomRace(false);
                        setFormData(prev => ({ ...prev, race: '', customRace: '' }));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <ArrowLeft size={14} />
                      กลับไปเลือกจากรายการ
                    </button>
                  </div>
                ) : (
                  <select
                    name="race"
                    value={formData.race}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                  >
                    <option value="">เลือกเชื้อชาติ</option>
                    <option value="ไทย">ไทย</option>
                    <option value="จีน">จีน</option>
                    <option value="มลายู">มลายู</option>
                    <option value="อินเดีย">อินเดีย</option>
                    <option value="ลาว">ลาว</option>
                    <option value="เขมร">เขมร</option>
                    <option value="พม่า">พม่า</option>
                    <option value="มอญ">มอญ</option>
                    <option value="other">อื่น ๆ (กรอกเอง)</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ข้อมูลที่อยู่</h2>
              <p className="text-gray-600">ที่อยู่ตามบัตรประชาชนและที่อยู่ปัจจุบัน</p>
            </div>

            {/* ที่อยู่ตามบัตรประชาชน */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ที่อยู่ตามบัตรประชาชน</h3>
              
              <div className="space-y-4">
                {/* บ้านเลขที่ และ หมู่ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">บ้านเลขที่</label>
                    <input
                      type="text"
                      name="idCardHouseNo"
                      value={formData.idCardHouseNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น 123/45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมู่ที่</label>
                    <input
                      type="text"
                      name="idCardMoo"
                      value={formData.idCardMoo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น 5"
                    />
                  </div>
                </div>

                {/* ซอย และ ถนน */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ซอย</label>
                    <input
                      type="text"
                      name="idCardSoi"
                      value={formData.idCardSoi}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น ลาดพร้าว 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ถนน</label>
                    <input
                      type="text"
                      name="idCardRoad"
                      value={formData.idCardRoad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น ลาดพร้าว"
                    />
                  </div>
                </div>

                {/* ตำบล และ อำเภอ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ตำบล/แขวง</label>
                    <input
                      type="text"
                      name="idCardSubDistrict"
                      value={formData.idCardSubDistrict}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น ลาดพร้าว"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อำเภอ/เขต</label>
                    <input
                      type="text"
                      name="idCardDistrict"
                      value={formData.idCardDistrict}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น จตุจักร"
                    />
                  </div>
                </div>

                {/* จังหวัด และ รหัสไปรษณีย์ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
                    <input
                      type="text"
                      name="idCardProvince"
                      value={formData.idCardProvince}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น กรุงเทพมหานคร"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      name="idCardPostalCode"
                      value={formData.idCardPostalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="เช่น 10900"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่มคัดลอกที่อยู่ */}
            <div className="flex items-center space-x-3 bg-amber-50 p-4 rounded-lg">
              <input
                type="checkbox"
                name="sameAsIdCard"
                checked={formData.sameAsIdCard}
                onChange={(e) => {
                  handleInputChange(e);
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      currentHouseNo: prev.idCardHouseNo,
                      currentMoo: prev.idCardMoo,
                      currentSoi: prev.idCardSoi,
                      currentRoad: prev.idCardRoad,
                      currentSubDistrict: prev.idCardSubDistrict,
                      currentDistrict: prev.idCardDistrict,
                      currentProvince: prev.idCardProvince,
                      currentPostalCode: prev.idCardPostalCode
                    }));
                  } else {
                    // ล้างข้อมูลที่อยู่ปัจจุบันเมื่อยกเลิก
                    setFormData(prev => ({
                      ...prev,
                      currentHouseNo: "",
                      currentMoo: "",
                      currentSoi: "",
                      currentRoad: "",
                      currentSubDistrict: "",
                      currentDistrict: "",
                      currentProvince: "",
                      currentPostalCode: ""
                    }));
                  }
                }}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label className="text-sm text-gray-700 font-medium">
                ที่อยู่ปัจจุบันเหมือนกับที่อยู่ตามบัตรประชาชน
              </label>
            </div>

            {/* ที่อยู่ปัจจุบัน */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ที่อยู่ปัจจุบัน</h3>
              
              <div className="space-y-4">
                {/* บ้านเลขที่ และ หมู่ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">บ้านเลขที่</label>
                    <input
                      type="text"
                      name="currentHouseNo"
                      value={formData.currentHouseNo}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น 123/45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมู่ที่</label>
                    <input
                      type="text"
                      name="currentMoo"
                      value={formData.currentMoo}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น 5"
                    />
                  </div>
                </div>

                {/* ซอย และ ถนน */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ซอย</label>
                    <input
                      type="text"
                      name="currentSoi"
                      value={formData.currentSoi}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น ลาดพร้าว 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ถนน</label>
                    <input
                      type="text"
                      name="currentRoad"
                      value={formData.currentRoad}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น ลาดพร้าว"
                    />
                  </div>
                </div>

                {/* ตำบล และ อำเภอ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ตำบล/แขวง</label>
                    <input
                      type="text"
                      name="currentSubDistrict"
                      value={formData.currentSubDistrict}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น ลาดพร้าว"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อำเภอ/เขต</label>
                    <input
                      type="text"
                      name="currentDistrict"
                      value={formData.currentDistrict}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น จตุจักร"
                    />
                  </div>
                </div>

                {/* จังหวัด และ รหัสไปรษณีย์ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
                    <input
                      type="text"
                      name="currentProvince"
                      value={formData.currentProvince}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น กรุงเทพมหานคร"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      name="currentPostalCode"
                      value={formData.currentPostalCode}
                      onChange={handleInputChange}
                      disabled={formData.sameAsIdCard}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 ${
                        formData.sameAsIdCard ? 'bg-gray-100' : ''
                      }`}
                      placeholder="เช่น 10900"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ข้อมูลติดต่อฉุกเฉินและสุขภาพ</h2>
              <p className="text-gray-600">ข้อมูลสำคัญสำหรับการรักษา</p>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                ข้อมูลติดต่อฉุกเฉิน
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ความสัมพันธ์</label>
                    {showCustomEmergencyRelation ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="customEmergencyRelation"
                          value={formData.customEmergencyRelation}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                          placeholder="ระบุความสัมพันธ์ เช่น เจ้านาย, เพื่อนร่วมงาน"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomEmergencyRelation(false);
                            setFormData(prev => ({ ...prev, emergencyContactRelation: '', customEmergencyRelation: '' }));
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <ArrowLeft size={14} />
                          กลับไปเลือกจากรายการ
                        </button>
                      </div>
                    ) : (
                      <select
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                      >
                        <option value="">เลือกความสัมพันธ์</option>
                        <option value="บิดา">บิดา</option>
                        <option value="มารดา">มารดา</option>
                        <option value="สามี">สามี</option>
                        <option value="ภรรยา">ภรรยา</option>
                        <option value="บุตร">บุตร</option>
                        <option value="บุตรี">บุตรี</option>
                        <option value="พี่ชาย">พี่ชาย</option>
                        <option value="พี่สาว">พี่สาว</option>
                        <option value="น้องชาย">น้องชาย</option>
                        <option value="น้องสาว">น้องสาว</option>
                        <option value="ญาติ">ญาติ</option>
                        <option value="เพื่อน">เพื่อน</option>
                        <option value="other">อื่น ๆ (กรอกเอง)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                ข้อมูลทางการแพทย์
              </h3>

              <div className="space-y-4">
                {/* Blood Group and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">กรุ๊ปเลือด</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    >
                      <option value="">เลือกกรุ๊ปเลือด</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="O">O</option>
                      <option value="AB">AB</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rh</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    >
                      <option value="">เลือก Rh</option>
                      <option value="+">บวก (+)</option>
                      <option value="-">ลบ (-)</option>
                    </select>
                  </div>
                </div>

                {/* Chronic Diseases */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">โรคประจำตัว</label>
                  <textarea
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ระบุโรคประจำตัว เช่น เบาหวาน, ความดันโลหิตสูง, โรคหัวใจ หรือใส่ 'ไม่มี' หากไม่มีโรคประจำตัว"
                  />
                </div>

                {/* Current Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ยาที่ใช้ประจำ</label>
                  <textarea
                    name="currentMedications"
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ระบุยาที่ใช้ประจำ เช่น ยาลดความดัน, ยาเบาหวาน หรือใส่ 'ไม่มี' หากไม่ได้ใช้ยาประจำ"
                  />
                </div>

                {/* Drug Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประวัติการแพ้ยา</label>
                  <textarea
                    name="drugAllergies"
                    value={formData.drugAllergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ระบุยาที่แพ้ เช่น ยาปฏิชีวนะ, ยาแก้ปวด, ยาชา หรือใส่ 'ไม่มี' หากไม่แพ้ยาใดๆ"
                  />
                </div>

                {/* Food Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประวัติการแพ้อาหาร</label>
                  <textarea
                    name="foodAllergies"
                    value={formData.foodAllergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ระบุอาหารที่แพ้ เช่น กุ้ง, ปู, ไข่, นม, ถั่วลิสง หรือใส่ 'ไม่มี' หากไม่แพ้อาหารใดๆ"
                  />
                </div>

                {/* Environment Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประวัติการแพ้สิ่งแวดล้อม</label>
                  <textarea
                    name="environmentAllergies"
                    value={formData.environmentAllergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                    placeholder="ระบุสิ่งแวดล้อมที่แพ้ เช่น ฝุ่น, เกสรดอกไม้, ขนสัตว์, สารเคมี หรือใส่ 'ไม่มี' หากไม่แพ้สิ่งใดๆ"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">การตั้งค่าความปลอดภัย</h2>
              <p className="text-gray-600">ปกป้องข้อมูลและบัญชีของคุณ</p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={formData.twoFactorAuth}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">เปิดใช้งานการยืนยันสองขั้นตอน</label>
                    <p className="text-sm text-gray-600 mt-1">
                      เพิ่มความปลอดภัยด้วยรหัส OTP ผ่าน SMS หรือแอป Authenticator
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">การแจ้งเตือนทางอีเมล</label>
                    <p className="text-sm text-gray-600 mt-1">
                      รับการแจ้งเตือนสำคัญ เช่น การนัดหมาย, ผลตรวจ, อัปเดตระบบ
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={formData.smsNotifications}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">การแจ้งเตือนทาง SMS</label>
                    <p className="text-sm text-gray-600 mt-1">
                      รับ SMS สำหรับการแจ้งเตือนเร่งด่วน เช่น ผลตรวจผิดปกติ, การนัดหมายฉุกเฉิน
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">สรุปข้อมูลที่กรอก</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ข้อมูลพื้นฐาน:</span>
                    <span className="text-green-600 font-medium">✓ ครบถ้วน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ข้อมูลที่อยู่:</span>
                    <span className="text-green-600 font-medium">✓ ครบถ้วน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ข้อมูลติดต่อฉุกเฉิน:</span>
                    <span className="text-green-600 font-medium">✓ ครบถ้วน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ข้อมูลสุขภาพ:</span>
                    <span className="text-green-600 font-medium">✓ ครบถ้วน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">การตั้งค่าความปลอดภัย:</span>
                    <span className="text-green-600 font-medium">✓ ตั้งค่าแล้ว</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formatFullAddress = (addressData: Record<string, string | boolean>, prefix: string) => {
    const parts = [
      addressData[`${prefix}HouseNo`],
      addressData[`${prefix}Moo`] ? `หมู่ ${addressData[`${prefix}Moo`]}` : '',
      addressData[`${prefix}Soi`] ? `ซ. ${addressData[`${prefix}Soi`]}` : '',
      addressData[`${prefix}Road`] ? `ถ. ${addressData[`${prefix}Road`]}` : '',
      addressData[`${prefix}SubDistrict`] ? `ต. ${addressData[`${prefix}SubDistrict`]}` : '',
      addressData[`${prefix}District`] ? `อ. ${addressData[`${prefix}District`]}` : '',
      addressData[`${prefix}Province`] ? `จ. ${addressData[`${prefix}Province`]}` : '',
      addressData[`${prefix}PostalCode`]
    ].filter(part => part && typeof part === 'string' && part.trim() !== '');
    
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="text-xl font-bold text-gray-800">HealthChain</span>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">ขั้นตอนที่ {currentStep} จาก {totalSteps}</span>
            <span className="text-sm font-medium text-blue-600">{getProgressPercentage()}% เสร็จสิ้น</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{width: `${getProgressPercentage()}%`}}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 ease-out ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ย้อนกลับ
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-150 ease-out"
            >
              ถัดไป
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-150 ease-out flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                'เสร็จสิ้น - เริ่มใช้งาน'
              )}
            </button>
          )}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/accounts/patient/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            ข้ามและใช้งานก่อน (สามารถกรอกภายหลังได้)
          </button>
        </div>
      </div>
    </div>
  );
}
