'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { formatThailandDate, getCurrentThailandDateString } from '@/utils/dateUtils';
import { PatientDocumentService, PatientDocument } from '@/services/patientDocumentService';
import { 
  Calendar, 
  Pill, 
  FileText, 
  Heart, 
  Activity, 
  Clock, 
  AlertCircle,
  TrendingUp,
  User,
  Phone,
  MapPin,
  Droplets,
  Settings,
  ArrowRight,
  Bell,
  CheckCircle,
  Download,
  Eye
} from 'lucide-react';

interface PatientData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  thaiFirstName?: string;
  thaiLastName?: string;
  phone?: string;
  nationalId?: string;
  hospitalNumber?: string;
  birthDate?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  gender?: string;
  address?: string;
  bloodType?: string;
  weight?: number;
  height?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  drugAllergies?: string;
  foodAllergies?: string;
  environmentAllergies?: string;
  chronicDiseases?: string;
  occupation?: string;
  education?: string;
  maritalStatus?: string;
  religion?: string;
  race?: string;
  insuranceType?: string;
  insuranceNumber?: string;
  insuranceExpiryDay?: number;
  insuranceExpiryMonth?: number;
  insuranceExpiryYear?: number;
}

const PatientDashboard = () => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<PatientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const { user } = useAuth();

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!patient) return 0;
    
    const fields = [
      'thaiFirstName', 'thaiLastName', 'firstName', 'lastName', 'nationalId', 
      'birthDay', 'birthMonth', 'birthYear', 'gender', 'bloodType', 'phone', 'address',
      'emergencyContactName', 'emergencyContactPhone',
      'drugAllergies', 'foodAllergies', 'environmentAllergies', 'chronicDiseases',
      'weight', 'height', 'occupation', 'education', 'maritalStatus', 'religion', 'race'
    ];
    
    const filledFields = fields.filter(field => {
      const value = patient[field as keyof PatientData];
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Check if user has valid token
        const token = apiClient.getAccessToken();
        logger.info('🔍 Patient Dashboard - Auth Check:', {
          user: !!user,
          token: !!token,
          userData: user,
          pathname: window.location.pathname,
          profileCompleted: user?.profileCompleted,
          profileCompletedType: typeof user?.profileCompleted,
          userRole: user?.role,
          userEmail: user?.email
        });
        
        if (!token) {
          logger.info('🔍 Patient Dashboard - No token, redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        // If no user data but have token, try to refresh user data
        if (!user && token) {
          logger.info('🔍 Patient Dashboard - No user data, refreshing...');
          window.dispatchEvent(new CustomEvent('refreshUserData'));
          return;
        }
        
        // If we have user data, load patient data
        if (user?.id) {
          logger.info('🔍 Patient Dashboard - Loading patient data for user:', user.id);
          const response = await apiClient.getCompleteProfile();
          if (response.statusCode === 200 && response.data) {
            setPatient(response.data as any);
            // โหลดเอกสารล่าสุด
            loadRecentDocuments();
          } else {
            setError('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
          }
        }
      } catch (err) {
        logger.error('Error fetching patient data:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [user]);

  // โหลดเอกสารล่าสุด
  const loadRecentDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const patientId = user?.id || '';
      if (patientId) {
        const response = await PatientDocumentService.getPatientDocuments(patientId, {
          limit: 5,
          page: 1
        });
        setRecentDocuments(response.documents);
      }
    } catch (error) {
      logger.error('Error loading recent documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="แดชบอร์ด" userType="patient">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-800">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="แดชบอร์ด" userType="patient">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateAgeFromParts = (day: number, month: number, year: number) => {
    if (!day || !month || !year) return 0;
    
    // Convert Buddhist Era to Christian Era
    const christianYear = year - 543;
    const today = new Date();
    const birth = new Date(christianYear, month - 1, day);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate age from available data
  const age = patient?.birthDate 
    ? calculateAge(patient.birthDate)
    : (patient?.birthDay && patient?.birthMonth && patient?.birthYear)
    ? calculateAgeFromParts(patient.birthDay, patient.birthMonth, patient.birthYear)
    : 0;

  //  age calculation
  return (
    <AppLayout title="แดชบอร์ด" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                ยินดีต้อนรับ, {patient?.thaiFirstName || user?.firstName || 'ผู้ป่วย'}
              </h1>
              <p className="text-gray-800 mt-1">
                ภาพรวมข้อมูลสุขภาพและการรักษาของคุณ
              </p>
            </div>
            <div className="text-right text-sm text-gray-700">
              <p>วันที่เข้าสู่ระบบล่าสุด</p>
              <p className="font-medium">{formatThailandDate(new Date())}</p>
            </div>
          </div>
          
        </div>

        {/* Patient Info Card */}
        {patient && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">ข้อมูลผู้ป่วย</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ชื่อไทย */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ชื่อ-นามสกุล (ไทย)</p>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      // Fallback to user data if patient data is not available
                      const thaiFirstName = patient?.thaiFirstName || user?.thaiFirstName;
                      const thaiLastName = patient?.thaiLastName || user?.thaiLastName;
                      
                      return thaiFirstName && thaiLastName 
                        ? `${thaiFirstName} ${thaiLastName}`
                        : 'ไม่ระบุ';
                    })()}
                  </p>
                </div>
              </div>

              {/* ชื่ออังกฤษ */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ชื่อ-นามสกุล (อังกฤษ)</p>
                  <p className="font-medium text-gray-900">
                    {patient.firstName && patient.lastName 
                      ? `${patient.firstName} ${patient.lastName}`
                      : 'ไม่ระบุ'
                    }
                  </p>
                </div>
              </div>

              {/* อายุ */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">อายุ</p>
                  <p className="font-medium text-gray-900">{age} ปี</p>
                </div>
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="font-medium text-gray-900">{patient.phone || 'ไม่ระบุ'}</p>
                </div>
              </div>

              {/* ที่อยู่ */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ที่อยู่</p>
                  <p className="font-medium text-gray-900">{patient.address || 'ไม่ระบุ'}</p>
                </div>
              </div>

              {/* เพศ */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เพศ</p>
                  <p className="font-medium text-gray-900">
                    {patient.gender === 'male' ? 'ชาย' : 
                     patient.gender === 'female' ? 'หญิง' : 
                     patient.gender === 'other' ? 'อื่นๆ' : 
                     'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              {/* หมู่เลือด */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">หมู่เลือด</p>
                  <p className="font-medium text-gray-900">{patient.bloodType || 'ไม่ระบุ'}</p>
                </div>
              </div>

              {/* HN หรือสถานะการลงทะเบียน */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">HN</p>
                  <p className="font-medium text-gray-900">
                    {patient.hospitalNumber 
                      ? patient.hospitalNumber 
                      : 'ยังไม่ได้ลงทะเบียนผ่านระบบ EMR'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Setup Alert */}
        {!user?.profileCompleted && (() => {
          const completionPercentage = calculateProfileCompletion();
          const isHighCompletion = completionPercentage >= 80;
          
          return (
            <div className={`${isHighCompletion ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${isHighCompletion ? 'bg-green-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}>
                    <AlertCircle className={`h-6 w-6 ${isHighCompletion ? 'text-green-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isHighCompletion ? 'text-green-900' : 'text-orange-900'}`}>
                      {isHighCompletion ? '🎉 โปรไฟล์เกือบสมบูรณ์!' : 'ตั้งค่าโปรไฟล์'}
                    </h3>
                    <p className={`text-sm ${isHighCompletion ? 'text-green-700' : 'text-orange-700'}`}>
                      {isHighCompletion 
                        ? `โปรไฟล์ของคุณสมบูรณ์ ${completionPercentage}% แล้ว! กรอกข้อมูลเพิ่มเติมเพื่อความสมบูรณ์`
                        : `กรุณาตั้งค่าโปรไฟล์ให้ครบถ้วนเพื่อใช้ฟีเจอร์ต่างๆ (${completionPercentage}%)`
                      }
                    </p>
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>ความคืบหน้า</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            completionPercentage >= 80 
                              ? 'bg-green-500' 
                              : completionPercentage >= 50 
                              ? 'bg-yellow-500' 
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <Link href="/setup-profile">
                  <button className={`flex items-center gap-2 px-4 py-2 ${isHighCompletion ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg transition-colors`}>
                    <Settings className="h-4 w-4" />
                    ตั้งค่าโปรไฟล์
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/accounts/patient/appointments">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">นัดหมาย</h3>
                  <p className="text-sm text-gray-600">จัดการนัดหมายแพทย์</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/accounts/patient/medications">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600">ยา</h3>
                  <p className="text-sm text-gray-600">รายการยาที่ใช้</p>
                </div>
                <Pill className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/accounts/patient/records">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">บันทึกสุขภาพ</h3>
                  <p className="text-sm text-gray-600">ประวัติการรักษา</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/accounts/patient/documents">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">เอกสาร</h3>
                  <p className="text-sm text-gray-600">เอกสารทางการแพทย์</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/accounts/patient/notifications">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600">การแจ้งเตือน</h3>
                  <p className="text-sm text-gray-600">ดูการแจ้งเตือนและอัปเดต</p>
                </div>
                <Bell className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/accounts/patient/consent-requests">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">คำขอเข้าถึงข้อมูล</h3>
                  <p className="text-sm text-gray-600">จัดการคำขอเข้าถึงข้อมูลสุขภาพ</p>
                </div>
                <FileText className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/accounts/patient/profile">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-600">โปรไฟล์</h3>
                  <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัว</p>
                </div>
                <User className="h-8 w-8 text-gray-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">ข้อมูลการใช้บริการล่าสุดของคุณ</p>
          <RecentActivities />
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">เอกสารล่าสุด</h2>
            </div>
            <Link href="/accounts/patient/documents">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">เอกสารทางการแพทย์ล่าสุดของคุณ</p>
          
          {documentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-gray-700">ยังไม่มีเอกสาร</p>
              <p className="text-sm">เอกสารจะแสดงเมื่อมีการตรวจหรือรักษา</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {doc.documentType === 'vital_signs' && '💓'}
                      {doc.documentType === 'history_taking' && '📋'}
                      {doc.documentType === 'doctor_visit' && '👨‍⚕️'}
                      {doc.documentType === 'lab_result' && '🧪'}
                      {doc.documentType === 'prescription' && '💊'}
                      {doc.documentType === 'appointment' && '📅'}
                      {doc.documentType === 'medical_certificate' && '📜'}
                      {doc.documentType === 'referral' && '📤'}
                      {!['vital_signs', 'history_taking', 'doctor_visit', 'lab_result', 'prescription', 'appointment', 'medical_certificate', 'referral'].includes(doc.documentType) && '📄'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{doc.documentTitle}</p>
                      <p className="text-xs text-gray-500">
                        {formatThailandDate(doc.created_at, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} • {doc.doctorName || 'ระบบ'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="ดูออนไลน์"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const blob = await PatientDocumentService.downloadDocument(doc.id);
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = doc.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          logger.error('Error downloading document:', error);
                          alert('ไม่สามารถดาวน์โหลดเอกสารได้');
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="ดาวน์โหลด"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">ภาพรวมสุขภาพ</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">ข้อมูลสุขภาพเบื้องต้นของคุณ</p>
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-gray-700">ยังไม่มีข้อมูลสุขภาพ</p>
            <p className="text-sm">ข้อมูลจะแสดงเมื่อมีการตรวจสุขภาพ</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

/**
 * Component สำหรับแสดงกิจกรรมล่าสุด
 */
const RecentActivities = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentNotifications = async () => {
      try {
        // TODO: ดึงข้อมูลจากฐานข้อมูลจริงแทน localStorage
        // const response = await apiClient.getPatientNotifications();
        // setNotifications(response.data);
        
        // สำหรับตอนนี้ให้แสดงข้อความว่าไม่มีข้อมูล
        setNotifications([]);
      } catch (error) {
        logger.error('Error loading recent notifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentNotifications();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">กำลังโหลด...</p>
      </div>
    );
  }

  // แสดงข้อความว่าไม่มีข้อมูล
  return (
    <div className="text-center py-8 text-gray-500">
      <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p className="text-gray-700">ยังไม่มีข้อมูลกิจกรรม</p>
      <p className="text-sm">ข้อมูลจะแสดงเมื่อคุณเริ่มใช้บริการ</p>
    </div>
  );
};

export default PatientDashboard;
