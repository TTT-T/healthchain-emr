'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, Activity, Calendar, Pill, FileText, 
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  Eye, ArrowRight, RefreshCw, Bell, Heart
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface DashboardStats {
  todayPatients: number;
  todayRegistrations: number;
  activeQueues: number;
  completedVisits: number;
  pendingLabs: number;
  upcomingAppointments: number;
  activeMedications: number;
  criticalAlerts: number;
}

interface QueueItem {
  id: string;
  queueNumber: string;
  patientName: string;
  status: 'waiting' | 'in_progress' | 'completed';
  department: string;
  waitTime: number;
  priority: 'normal' | 'urgent' | 'emergency';
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'visit' | 'lab' | 'prescription' | 'appointment';
  description: string;
  timestamp: string;
  user: string;
  status: 'success' | 'warning' | 'error';
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function EMRDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayPatients: 0,
    todayRegistrations: 0,
    activeQueues: 0,
    completedVisits: 0,
    pendingLabs: 0,
    upcomingAppointments: 0,
    activeMedications: 0,
    criticalAlerts: 0
  });

  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('📊 Loading dashboard data...');

      // Fetch real data from API
      const promises = [
        apiClient.getPatients({ page: 1, limit: 100 }),
        // TODO: Add more real API calls when available:
        // apiClient.getAppointments({ page: 1, limit: 10 }),
        // apiClient.getLabResults({ page: 1, limit: 10 }),
        // apiClient.getMedications({ page: 1, limit: 10 }),
      ];

      const [patientsResponse] = await Promise.all(promises);

      // Calculate stats from real data
      const patientsData = (patientsResponse.data?.patients as any[]) || [];
      const todayPatientsCount = patientsData.length;
      
      // Count patients with active visits (in_progress status)
      const activeQueueCount = patientsData.filter((patient: any) => 
        patient.visit_info?.visit_status === 'in_progress' || 
        patient.visit_status === 'in_progress'
      ).length;
      
      // Count completed visits
      const completedVisitsCount = patientsData.filter((patient: any) => 
        patient.visit_info?.visit_status === 'completed' || 
        patient.visit_status === 'completed'
      ).length;
      
      // Set real stats from actual data
      setStats({
        todayPatients: todayPatientsCount,
        todayRegistrations: todayPatientsCount, // All patients are registrations for now
        activeQueues: activeQueueCount, // Count only patients with in_progress visits
        completedVisits: completedVisitsCount, // Count completed visits
        pendingLabs: 0, // Will be calculated from real lab data when available
        upcomingAppointments: 0, // Will be calculated from real appointment data when available
        activeMedications: 0, // Will be calculated from real medication data when available
        criticalAlerts: 0 // Will be calculated from real alert data when available
      });

      // Generate queue data from patients with active visits only
      const activePatients = patientsData.filter((patient: any) => 
        patient.visit_info?.visit_status === 'in_progress' || 
        patient.visit_status === 'in_progress'
      );
      
      const queueData: QueueItem[] = activePatients.slice(0, 5).map((patient: any, index: number) => ({
        id: `${patient.id}-queue-${index}`, // Make unique key by adding index
        queueNumber: patient.visit_info?.visit_number || patient.personal_info?.hospital_number || `HN${String(index + 1).padStart(3, '0')}`,
        patientName: patient.personal_info?.thai_name || `${patient.personal_info?.first_name || ''} ${patient.personal_info?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
        status: 'waiting' as any, // Real status - patients with in_progress visits are waiting
        department: patient.department || 'ไม่ระบุแผนก',
        waitTime: 0, // Real wait time - will be calculated from appointment data when available
        priority: 'normal' as any // Real priority - default to normal for now
      }));
      setQueues(queueData);

      // Generate recent activities from patients - use real data
      const activities: RecentActivity[] = patientsData.slice(0, 3).map((patient: any, index: number) => ({
        id: `${patient.id}-activity-${index}`, // Make unique key by adding index
        type: 'registration' as any, // Real activity type - patient registration
        description: `ลงทะเบียนผู้ป่วย: ${patient.personal_info?.thai_name || `${patient.personal_info?.first_name || ''} ${patient.personal_info?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'}`,
        timestamp: patient.created_at || new Date().toISOString(),
        user: user?.thaiName || user?.firstName || 'เจ้าหน้าที่',
        status: 'success' as any // Real status - registration is successful
      }));
      setRecentActivities(activities);

      // Generate alerts from real data - show actual system status
      const alertsData: Alert[] = [];
      
      // Add info alert if there are patients
      if (todayPatientsCount > 0) {
        alertsData.push({
          id: '1',
          type: 'info',
          title: 'ข้อมูลผู้ป่วย',
          message: `พบผู้ป่วยทั้งหมด ${todayPatientsCount} รายในระบบ`,
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
      
      // Add warning if no patients
      if (todayPatientsCount === 0) {
        alertsData.push({
          id: '2',
          type: 'warning',
          title: 'ไม่มีข้อมูลผู้ป่วย',
          message: 'ยังไม่มีผู้ป่วยในระบบ กรุณาลงทะเบียนผู้ป่วยใหม่',
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
      
      setAlerts(alertsData);

      logger.debug('✅ Dashboard data loaded successfully');
    } catch (err: any) {
      logger.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด');
      
      // Fallback to basic stats
      setStats({
        todayPatients: 0,
        todayRegistrations: 0,
        activeQueues: 0,
        completedVisits: 0,
        pendingLabs: 0,
        upcomingAppointments: 0,
        activeMedications: 0,
        criticalAlerts: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.firstName, user?.thaiName]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [selectedTimeRange, isAuthenticated, loadDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration': return <UserPlus className="h-4 w-4" />;
      case 'visit': return <Activity className="h-4 w-4" />;
      case 'lab': return <FileText className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const StatCard = ({ title, value, change, icon: Icon, color, link }: any) => (
    <Link href={link}>
      <div className={`bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
            {change && (
              <div className="flex items-center mt-1 md:mt-2">
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs md:text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}% จากเมื่อวาน
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 md:p-3 rounded-lg ${color.replace('border-l-4', 'bg-opacity-10')} flex-shrink-0 ml-2`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </div>
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">เข้าสู่ระบบ</h2>
          <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งาน Dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 p-4 md:p-6">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard EMR</h1>
              <p className="text-sm md:text-base text-gray-600">ภาพรวมระบบ Electronic Medical Record</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="today">วันนี้</option>
                <option value="week">สัปดาห์นี้</option>
                <option value="month">เดือนนี้</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex-shrink-0">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">เกิดข้อผิดพลาด:</span>
            </div>
            <p className="mt-1">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                loadDashboardData();
              }}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Alert Bar */}
        {alerts.filter(alert => !alert.isRead && alert.type === 'critical').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 md:mb-6 flex-shrink-0">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                มีการแจ้งเตือนวิกฤต {alerts.filter(alert => !alert.isRead && alert.type === 'critical').length} รายการ
              </span>
              <button className="ml-auto text-red-600 hover:text-red-800">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title="ผู้ป่วยวันนี้"
              value={stats.todayPatients}
              icon={Users}
              color="border-blue-500"
              link="/emr/patient-summary"
            />
            <StatCard
              title="ลงทะเบียนใหม่"
              value={stats.todayRegistrations}
              icon={UserPlus}
              color="border-green-500"
              link="/emr/register-patient"
            />
            <StatCard
              title="คิวรอตรวจ"
              value={stats.activeQueues}
              icon={Clock}
              color="border-yellow-500"
              link="/emr/checkin"
            />
            <StatCard
              title="เสร็จสิ้นแล้ว"
              value={stats.completedVisits}
              icon={CheckCircle}
              color="border-purple-500"
              link="/emr/doctor-visit"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title="รอผลแลบ"
              value={stats.pendingLabs}
              icon={FileText}
              color="border-orange-500"
              link="/emr/lab-result"
            />
            <StatCard
              title="นัดหมายถัดไป"
              value={stats.upcomingAppointments}
              icon={Calendar}
              color="border-indigo-500"
              link="/emr/appointments"
            />
            <StatCard
              title="ยาที่กำลังใช้"
              value={stats.activeMedications}
              icon={Pill}
              color="border-pink-500"
              link="/emr/pharmacy"
            />
            <StatCard
              title="แจ้งเตือนสำคัญ"
              value={stats.criticalAlerts}
              icon={Bell}
              color="border-red-500"
              link="#"
            />
          </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Queue Status */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">สถานะคิวปัจจุบัน</h2>
              <Link href="/emr/checkin" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                ดูทั้งหมด <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {queues.map((queue) => (
                <div key={queue.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(queue.priority)} flex-shrink-0`}>
                      {queue.queueNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{queue.patientName}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{queue.department}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(queue.status)}`}>
                      {queue.status === 'waiting' ? 'รอตรวจ' : 
                       queue.status === 'in_progress' ? 'กำลังตรวจ' : 'เสร็จสิ้น'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">รอ {queue.waitTime} นาที</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">เมนูหลัก</h2>
            <div className="space-y-2 md:space-y-3">
              <Link href="/emr/user-search" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">ค้นหาผู้ใช้เพื่อลงทะเบียน</span>
              </Link>
              <Link href="/emr/register-patient" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">ลงทะเบียนผู้ป่วยใหม่</span>
              </Link>
              <Link href="/emr/checkin" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-green-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">เช็คอิน / สร้างคิว</span>
              </Link>
              <Link href="/emr/vital-signs" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">วัดสัญญาณชีพ</span>
              </Link>
              <Link href="/emr/doctor-visit" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">ตรวจโดยแพทย์</span>
              </Link>
              <Link href="/emr/pharmacy" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Pill className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">จ่ายยา</span>
              </Link>
              <Link href="/emr/patient-summary" className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm md:text-base">ดูประวัติผู้ป่วย</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm">ดูทั้งหมด</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'success' ? 'bg-green-100' :
                    activity.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">{activity.user}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm">ดูทั้งหมด</button>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${!alert.isRead ? 'ring-2 ring-opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">{formatTime(alert.timestamp)}</p>
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>อัปเดตล่าสุด: {new Date().toLocaleString('th-TH', { 
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
          })}</p>
        </div>
        
        </div>
      </div>
    </div>
  );
}
