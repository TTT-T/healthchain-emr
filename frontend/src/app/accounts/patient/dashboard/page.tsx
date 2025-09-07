'use client';

import React, { useState, useEffect } from 'react';
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
  Droplets
} from 'lucide-react';

interface PatientData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  phone?: string;
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
  emergency_contact?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_history?: string;
  allergies?: string;
  drug_allergies?: string;
  medications?: string;
  chronic_diseases?: string;
}

const PatientDashboard = () => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        if (user?.id) {
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-gray-800" />
                ข้อมูลผู้ป่วย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">ชื่อ-นามสกุล</p>
                    <p className="font-medium">{patient.thai_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">อายุ</p>
                    <p className="font-medium text-gray-800">{age} ปี</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">เบอร์โทรศัพท์</p>
                    <p className="font-medium text-gray-800">{patient.phone || 'ไม่ระบุ'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">ที่อยู่</p>
                    <p className="font-medium text-gray-800">{patient.current_address || patient.address || 'ไม่ระบุ'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">หมู่เลือด</p>
                    <p className="font-medium text-gray-800">
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
                    <p className="text-sm text-gray-700">HN</p>
                    <p className="font-medium text-gray-800">{patient.hospital_number || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">นัดหมาย</h3>
                  <p className="text-sm text-gray-700">จัดการนัดหมายแพทย์</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">ยา</h3>
                  <p className="text-sm text-gray-700">รายการยาที่ใช้</p>
                </div>
                <Pill className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">ผลแลป</h3>
                  <p className="text-sm text-gray-700">ผลการตรวจวิเคราะห์</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">เอกสาร</h3>
                  <p className="text-sm text-gray-700">เอกสารทางการแพทย์</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="h-5 w-5 text-gray-800" />
              กิจกรรมล่าสุด
            </CardTitle>
            <CardDescription className="text-gray-600">
              ข้อมูลการใช้บริการล่าสุดของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-700">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีข้อมูลกิจกรรม</p>
                <p className="text-sm text-gray-500">ข้อมูลจะแสดงเมื่อคุณเริ่มใช้บริการ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5 text-gray-800" />
              ภาพรวมสุขภาพ
            </CardTitle>
            <CardDescription className="text-gray-600">
              ข้อมูลสุขภาพเบื้องต้นของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-700">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีข้อมูลสุขภาพ</p>
              <p className="text-sm text-gray-500">ข้อมูลจะแสดงเมื่อมีการตรวจสุขภาพ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PatientDashboard;
