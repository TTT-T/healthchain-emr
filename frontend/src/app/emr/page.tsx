'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, Users, Activity, FileText, Calendar, 
  Pill, Stethoscope, ChevronRight, ArrowRight,
  Clock, Shield, Zap, BarChart3, CheckCircle,
  UserPlus, ClipboardList, Search, Eye
} from 'lucide-react';

interface QuickStats {
  todayPatients: number;
  activeQueues: number;
  pendingLabs: number;
  upcomingAppointments: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export default function EMRDashboardPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [stats, setStats] = useState<QuickStats>({
    todayPatients: 0,
    activeQueues: 0,
    pendingLabs: 0,
    upcomingAppointments: 0
  });

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Mock stats data
    setStats({
      todayPatients: 47,
      activeQueues: 12,
      pendingLabs: 8,
      upcomingAppointments: 23
    });

    return () => clearInterval(interval);
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'register',
      title: 'ลงทะเบียนผู้ป่วยใหม่',
      description: 'เพิ่มผู้ป่วยใหม่เข้าสู่ระบบ',
      href: '/emr/register-patient',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'checkin',
      title: 'เช็คอิน / สร้างคิว',
      description: 'เช็คอินผู้ป่วยและสร้างคิวรอ',
      href: '/emr/checkin',
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'vital-signs',
      title: 'วัดสัญญาณชีพ',
      description: 'บันทึกสัญญาณชีพของผู้ป่วย',
      href: '/emr/vital-signs',
      icon: Activity,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    },
    {
      id: 'history',
      title: 'ซักประวัติ',
      description: 'ซักประวัติและอาการของผู้ป่วย',
      href: '/emr/history-taking',
      icon: Search,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'doctor-visit',
      title: 'ตรวจโดยแพทย์',
      description: 'บันทึกการตรวจและวินิจฉัย',
      href: '/emr/doctor-visit',
      icon: Stethoscope,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'pharmacy',
      title: 'จ่ายยา',
      description: 'จ่ายยาและบันทึกการจ่ายยา',
      href: '/emr/pharmacy',
      icon: Pill,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'lab-result',
      title: 'ผลแลบ / แนบไฟล์',
      description: 'บันทึกผลตรวจทางห้องปฏิบัติการ',
      href: '/emr/lab-result',
      icon: FileText,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100'
    },
    {
      id: 'appointments',
      title: 'นัดหมาย',
      description: 'จัดการนัดหมายผู้ป่วย',
      href: '/emr/appointments',
      icon: Calendar,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100'
    },
    {
      id: 'documents',
      title: 'ออกเอกสาร',
      description: 'สร้างเอกสารทางการแพทย์',
      href: '/emr/documents',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      id: 'patient-summary',
      title: 'ดูประวัติผู้ป่วย',
      description: 'ดูประวัติและข้อมูลผู้ป่วย',
      href: '/emr/patient-summary',
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'ปลอดภัยและเชื่อถือได้',
      description: 'ระบบรักษาความปลอดภัยข้อมูลระดับสูง'
    },
    {
      icon: Zap,
      title: 'รวดเร็วและมีประสิทธิภาพ',
      description: 'ประมวลผลและเข้าถึงข้อมูลได้อย่างรวดเร็ว'
    },
    {
      icon: BarChart3,
      title: 'รายงานและสถิติ',
      description: 'วิเคราะห์ข้อมูลและสร้างรายงานแบบเรียลไทม์'
    },
    {
      icon: Users,
      title: 'ใช้งานง่าย',
      description: 'ออกแบบให้ใช้งานง่ายสำหรับบุคลากรทางการแพทย์'
    }
  ];

  return (
    <div className="h-full bg-gray-50 p-4 md:p-6">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Header Section */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 md:mb-0 md:mr-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">EMR Dashboard</h1>
                <p className="text-base md:text-lg text-gray-600">Electronic Medical Record</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <p className="text-blue-800 font-medium text-sm md:text-base">
                <Clock className="h-4 w-4 inline mr-2" />
                {currentTime}
              </p>
            </div>

            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
              ระบบบันทึกข้อมูลทางการแพทย์อิเล็กทรอนิกส์ 
              สำหรับการจัดการข้อมูลผู้ป่วยและกระบวนการรักษาแบบครบวงจร
            </p>
          </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">ผู้ป่วยวันนี้</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.todayPatients}</p>
            </div>
            <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">คิวที่รอ</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.activeQueues}</p>
            </div>
            <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">รอผลแลบ</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.pendingLabs}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">นัดหมายวันนี้</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-0">เมนูหลัก</h2>
          <Link 
            href="/emr/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base"
          >
            ดูแดชบอร์ดทั้งหมด
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                href={action.href}
                className={`${action.bgColor} rounded-lg p-4 md:p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-gray-200`}
              >
                <div className="flex items-start">
                  <Icon className={`h-6 w-6 md:h-8 md:w-8 ${action.color} mr-3 md:mr-4 mt-1`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{action.title}</h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">{action.description}</p>
                    <div className="flex items-center text-xs md:text-sm font-medium text-gray-700">
                      เริ่มใช้งาน
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6 md:mb-8">
          ทำไมต้องเลือกระบบ EMR ของเรา
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md">
                  <Icon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{feature.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow Section */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6 md:mb-8">
          ขั้นตอนการใช้งาน
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { step: 1, title: 'ลงทะเบียน', desc: 'ลงทะเบียนผู้ป่วยใหม่', icon: UserPlus, color: 'bg-blue-500' },
            { step: 2, title: 'เช็คอิน', desc: 'สร้างคิวรอรักษา', icon: ClipboardList, color: 'bg-green-500' },
            { step: 3, title: 'วัดสัญญาณชีพ', desc: 'บันทึกไวทัลไซน์', icon: Activity, color: 'bg-pink-500' },
            { step: 4, title: 'ตรวจรักษา', desc: 'วินิจฉัยและรักษา', icon: Stethoscope, color: 'bg-purple-500' },
            { step: 5, title: 'จ่ายยา', desc: 'จ่ายยาและเอกสาร', icon: Pill, color: 'bg-orange-500' }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 md:w-16 md:h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-white`}>
                  <Icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div className={`w-6 h-6 md:w-8 md:h-8 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xs md:text-sm font-bold`}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
        <p className="text-gray-600 text-sm md:text-base">
          © 2025 EMR System - Electronic Medical Record
        </p>
        <p className="text-xs md:text-sm text-gray-500 mt-2">
          ระบบบันทึกข้อมูลทางการแพทย์อิเล็กทรอนิกส์
        </p>
      </div>
      
      </div>
      </div>
    </div>
  );
}
