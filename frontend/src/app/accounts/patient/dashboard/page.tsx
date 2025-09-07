'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
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
  ArrowRight
} from 'lucide-react';

interface PatientData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  phone?: string;
  phone_number?: string;
  national_id?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  current_address?: string;
  blood_group?: string;
  blood_type?: string;
  weight?: string;
  height?: string;
  hospital_number?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_history?: string;
  allergies?: string;
  drug_allergies?: string;
  food_allergies?: string;
  environment_allergies?: string;
  medications?: string;
  chronic_diseases?: string;
  religion?: string;
  race?: string;
  occupation?: string;
  marital_status?: string;
  education?: string;
}

const PatientDashboard = () => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Check if user has valid token
        const token = apiClient.getAccessToken();
        logger.debug('🔍 Patient Dashboard - Auth Check:', {
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
          logger.debug('🔍 Patient Dashboard - No token, redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        // If no user data but have token, try to refresh user data
        if (!user && token) {
          logger.debug('🔍 Patient Dashboard - No user data, refreshing...');
          window.dispatchEvent(new CustomEvent('refreshUserData'));
          return;
        }
        
        // If we have user data, load patient data
        if (user?.id) {
          logger.debug('🔍 Patient Dashboard - Loading patient data for user:', user.id);
          const response = await apiClient.getProfile();
          if (response.statusCode === 200 && response.data) {
            setPatient(response.data as any);
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

  const age = patient?.birth_date ? calculateAge(patient.birth_date) : 0;

  return (
    <AppLayout title="แดชบอร์ด" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                ยินดีต้อนรับ, {patient?.thai_name || (user as any)?.first_name || 'ผู้ป่วย'}
              </h1>
              <p className="text-gray-800 mt-1">
                ภาพรวมข้อมูลสุขภาพและการรักษาของคุณ
              </p>
            </div>
            <div className="text-right text-sm text-gray-700">
              <p>วันที่เข้าสู่ระบบล่าสุด</p>
              <p className="font-medium">{new Date().toLocaleDateString('th-TH')}</p>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-gray-900">{patient.thai_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">อายุ</p>
                  <p className="font-medium text-gray-900">{age} ปี</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="font-medium text-gray-900">{patient.phone || patient.phone_number || 'ไม่ระบุ'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ที่อยู่</p>
                  <p className="font-medium text-gray-900">{patient.current_address || patient.address || 'ไม่ระบุ'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">หมู่เลือด</p>
                  <p className="font-medium text-gray-900">
                    {patient.blood_group && patient.blood_type 
                      ? `${patient.blood_group}${patient.blood_type}` 
                      : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">HN</p>
                  <p className="font-medium text-gray-900">{patient.hospital_number || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Setup Alert */}
        {!user?.profileCompleted && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">ตั้งค่าโปรไฟล์</h3>
                  <p className="text-sm text-orange-700">กรุณาตั้งค่าโปรไฟล์ให้ครบถ้วนเพื่อใช้ฟีเจอร์ต่างๆ</p>
                </div>
              </div>
              <Link href="/setup-profile">
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                  ตั้งค่าโปรไฟล์
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        )}

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
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-gray-700">ยังไม่มีข้อมูลกิจกรรม</p>
            <p className="text-sm">ข้อมูลจะแสดงเมื่อคุณเริ่มใช้บริการ</p>
          </div>
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

export default PatientDashboard;
