"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import MedicalHeader from "@/components/MedicalHeader";
import { logger } from '@/lib/logger';

export default function NurseProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hospital: "",
    department: "",
    ward: "",
    nursing_license: "",
    experience_years: "",
    education: "",
    certifications: "",
    shift: "",
    bio: "",
    position: "",
    professional_license: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getNurseProfile();
        
        if (response.statusCode === 200 && !response.error && response.data) {
          const profile = response.data as any;
          setFormData({
            firstName: profile.user?.firstName || "",
            lastName: profile.user?.lastName || "",
            email: profile.user?.email || "",
            phone: profile.user?.phone || "",
            hospital: profile.nurse?.department || "",
            department: profile.nurse?.department || "",
            ward: profile.nurse?.department || "",
            nursing_license: profile.nurse?.nursingLicenseNumber || "",
            experience_years: profile.nurse?.yearsOfExperience || "",
            education: profile.nurse?.education || "",
            certifications: profile.nurse?.certifications || "",
            shift: profile.nurse?.shiftPreference || "",
            bio: profile.nurse?.bio || "",
            position: profile.nurse?.position || "",
            professional_license: profile.nurse?.nursingLicenseNumber || ""
          });
        } else if (user) {
          // Fallback to user data if profile not found
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            hospital: (user as any).hospital || "",
            department: (user as any).department || "",
            ward: (user as any).ward || "",
            nursing_license: user.professionalLicense || "",
            experience_years: (user as any).experience || "",
            education: (user as any).education || "",
            certifications: (user as any).certifications || "",
            shift: (user as any).shift || "",
            bio: (user as any).bio || "",
            position: user.position || "",
            professional_license: user.professionalLicense || ""
          });
        }
      } catch (error) {
        logger.error('Error loading user data:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, นามสกุล, อีเมล)');
        return;
      }
      
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
        return;
      }
      
      // Phone validation (if provided)
      if (formData.phone && !/^[0-9\-\s\+\(\)]+$/.test(formData.phone)) {
        setError('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
        return;
      }
      
      // Prepare data for API
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        specialization: formData.ward,
        nursingLicenseNumber: formData.nursing_license,
        yearsOfExperience: parseInt(formData.experience_years) || 0,
        education: formData.education,
        certifications: formData.certifications,
        shiftPreference: formData.shift,
        position: formData.position
      };

      const response = await apiClient.updateNurseProfile(updateData);
      
      if (response.statusCode === 200 && !response.error && response.data) {
        setSuccess('บันทึกข้อมูลสำเร็จ');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error: any) {
      logger.error('Error saving profile:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MedicalHeader title="แก้ไขข้อมูลโปรไฟล์พยาบาล" backHref="/accounts/nurse/dashboard" userType="nurse" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                Nu
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">พยาบาล{formData.firstName} {formData.lastName}</h2>
                <p className="text-pink-600 font-medium text-lg">หอผู้ป่วย{formData.ward}</p>
                <p className="text-slate-600">{formData.hospital} • แผนก{formData.department}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                    ใบประกอบวิชาชีพ {formData.nursing_license}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    ประสบการณ์ {formData.experience_years} ปี
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    กะ{formData.shift}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              {/* ข้อมูลส่วนตัว */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">ข้อมูลส่วนตัว</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">ชื่อ</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">นามสกุล</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">อีเมล</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ข้อมูลการทำงาน */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">ข้อมูลการทำงาน</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">โรงพยาบาล</label>
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">แผนก</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    >
                      <option value="">เลือกแผนก</option>
                      <option value="อายุรกรรม">อายุรกรรม</option>
                      <option value="ศัลยกรรม">ศัลยกรรม</option>
                      <option value="กุมารเวชกรรม">กุมารเวชกรรม</option>
                      <option value="สูติ-นรีเวชกรรม">สูติ-นรีเวชกรรม</option>
                      <option value="จิตเวชกรรม">จิตเวชกรรม</option>
                      <option value="ออร์โธปิดิกส์">ออร์โธปิดิกส์</option>
                      <option value="ICU">หอผู้ป่วยวิกฤต</option>
                      <option value="ER">แผนกฉุกเฉิน</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">หอผู้ป่วย</label>
                    <input
                      type="text"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="เช่น อายุรกรรมชาย, ศัลยกรรมหญิง"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">ใบอนุญาตประกอบวิชาชีพ</label>
                    <input
                      type="text"
                      name="nursingLicense"
                      value={formData.nursing_license}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">ประสบการณ์ (ปี)</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">กะการทำงาน</label>
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    >
                      <option value="">เลือกกะการทำงาน</option>
                      <option value="กลางวัน">กลางวัน (08:00-16:00)</option>
                      <option value="บ่าย">บ่าย (16:00-00:00)</option>
                      <option value="กลางคืน">กลางคืน (00:00-08:00)</option>
                      <option value="หมุนเวียน">หมุนเวียน</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ข้อมูลการศึกษาและใบรับรอง */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">การศึกษาและใบรับรอง</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">วุฒิการศึกษา</label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">ใบรับรองความเชี่ยวชาญ</label>
                    <textarea
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                      placeholder="ใส่ใบรับรองต่างๆ คั่นด้วยเครื่องหมายจุลภาค เช่น การพยาบาลผู้ป่วยโรคหัวใจ, การพยาบาลผู้ป่วยวิกฤต"
                    />
                  </div>
                </div>
              </div>

              {/* ข้อมูลเพิ่มเติม */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">ข้อมูลเพิ่มเติม</h3>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">ประวัติส่วนตัว / ความเชี่ยวชาญ</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                    placeholder="เล่าเกี่ยวกับประสบการณ์และความเชี่ยวชาญของคุณ..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังบันทึก...
                    </div>
                  ) : (
                    "บันทึกข้อมูล"
                  )}
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200"
                  onClick={() => window.history.back()}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
