"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X, Shield, Lock } from "lucide-react";
import { logger } from '@/lib/logger';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "weak",
    feedback: [] as string[],
    isValid: false
  });
  
  const [requirements, setRequirements] = useState<any>(null);

  // Load password requirements
  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const response = await apiClient.getPasswordRequirements();
        if (response.statusCode === 200 && !response.error) {
          setRequirements(response.data);
        }
      } catch (error) {
        logger.error("Error loading password requirements:", error);
      }
    };

    loadRequirements();
  }, []);

  // Validate password strength when new password changes
  useEffect(() => {
    if (formData.newPassword) {
      const validatePassword = async () => {
        try {
          const response = await apiClient.validatePasswordStrength(formData.newPassword);
          if (response.statusCode === 200 && !response.error) {
            setPasswordStrength(response.data as { score: number; strength: string; feedback: string[]; isValid: boolean; });
          }
        } catch (error) {
          logger.error("Error validating password:", error);
        }
      };

      validatePassword();
    } else {
      setPasswordStrength({
        score: 0,
        strength: "weak",
        feedback: [],
        isValid: false
      });
    }
  }, [formData.newPassword]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStrengthWidth = (score: number) => {
    return `${(score / 5) * 100}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
      
      if (formData.currentPassword === formData.newPassword) {
        setError('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน');
        return;
      }
      
      if (!passwordStrength.isValid) {
        setError('รหัสผ่านใหม่ไม่แข็งแรงพอ กรุณาตรวจสอบข้อกำหนด');
        return;
      }

      const response = await apiClient.changePassword(formData);
      
      if (response.statusCode === 200 && !response.error && response.data) {
        setSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setPasswordStrength({
          score: 0,
          strength: "weak",
          feedback: [],
          isValid: false
        });
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/accounts/patient/dashboard');
        }, 3000);
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (error: any) {
      logger.error('Error changing password:', error);
      setError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h1>
              <p className="text-gray-600">อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัย</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>ผู้ใช้: {user.firstName} {user.lastName}</span>
          </div>
        </div>

        {/* Password Requirements */}
        {requirements && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">ข้อกำหนดรหัสผ่าน</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ความยาวอย่างน้อย {requirements.minLength} ตัวอักษร</li>
              <li>• ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)</li>
              <li>• ต้องมีตัวอักษรพิมพ์เล็ก (a-z)</li>
              <li>• ต้องมีตัวเลข (0-9)</li>
              <li>• ต้องมีอักขระพิเศษ (!@#$%^&*)</li>
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านปัจจุบัน
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="กรอกรหัสผ่านใหม่"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">ความแข็งแรงของรหัสผ่าน:</span>
                    <span className={`text-sm font-medium ${getStrengthColor(passwordStrength.strength)}`}>
                      {passwordStrength.strength === 'weak' && 'อ่อน'}
                      {passwordStrength.strength === 'medium' && 'ปานกลาง'}
                      {passwordStrength.strength === 'strong' && 'แข็งแรง'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 'weak' ? 'bg-red-500' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: getStrengthWidth(passwordStrength.score) }}
                    />
                  </div>
                  
                  {/* Password Feedback */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">{feedback}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {passwordStrength.isValid && (
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">รหัสผ่านแข็งแรงพอ</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <div className="flex items-center space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">รหัสผ่านตรงกัน</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">รหัสผ่านไม่ตรงกัน</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{success}</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  กำลังเปลี่ยนเส้นทางไปยังหน้าแดชบอร์ด...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || !passwordStrength.isValid || formData.newPassword !== formData.confirmPassword}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}