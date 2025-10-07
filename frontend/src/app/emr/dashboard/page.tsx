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
import { VisitService } from '@/services/visitService';
import { logger } from '@/lib/logger';
// import { getThailandTime, formatBuddhistDate } from '@/utils/thailandTime';

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
  priority: 'normal' | 'urgent' | 'low' | 'high' | 'emergency';
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
    console.log('🔍 loadDashboardData called');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 user:', user);
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, returning early');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('📊 Loading dashboard data...');
      console.log('🔍 Dashboard: Starting to load data...');

      // Check authentication first
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log('🔍 Dashboard: Token exists:', !!token);
      console.log('🔍 Dashboard: Current user:', user);
      console.log('🔍 Dashboard: User role:', user?.role);
      console.log('🔍 Dashboard: User ID:', user?.id);

      // Fetch real data from API - errors are now handled gracefully in API client
      const promises = [
        apiClient.getPatients({ page: 1, limit: 100 }),
        apiClient.getVisits({ page: 1, limit: 100, doctor_id: user?.id }),
        apiClient.getAppointments({ page: 1, limit: 10 }),
      ];

      const [patientsResult, visitsResult, appointmentsResult] = await Promise.allSettled(promises);
      
      // Extract data from settled promises, handling both fulfilled and rejected cases
      let patientsData = [];
      let visitsData = [];
      
      if (patientsResult.status === 'fulfilled' && patientsResult.value?.data) {
        if (Array.isArray(patientsResult.value.data)) {
          patientsData = patientsResult.value.data;
        } else if (patientsResult.value.data.patients) {
          patientsData = patientsResult.value.data.patients;
        }
      }
      
      if (visitsResult.status === 'fulfilled' && visitsResult.value?.data) {
        if (Array.isArray(visitsResult.value.data)) {
          visitsData = visitsResult.value.data;
        } else if (visitsResult.value.data.visits) {
          visitsData = visitsResult.value.data.visits;
        }
      }
      
      console.log('🔍 After extraction - Patients Data Length:', patientsData.length);
      console.log('🔍 After extraction - Visits Data Length:', visitsData.length);
      
      const appointmentsData = appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data 
        ? (Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : [])
        : [];
      
      // Check for server errors in the responses
      let hasServerError = false;
      
      if (patientsResult.status === 'fulfilled' && patientsResult.value?.statusCode === 500) {
        logger.warn('Patients API returned 500 error - using fallback data');
        hasServerError = true;
      }
      
      if (visitsResult.status === 'fulfilled' && visitsResult.value?.statusCode === 500) {
        logger.warn('Visits API returned 500 error - using fallback data');
        hasServerError = true;
      }
      
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.statusCode === 500) {
        logger.warn('Appointments API returned 500 error - using fallback data');
        hasServerError = true;
      }
      
      // Show user-friendly message if there are server errors
      if (hasServerError) {
        setError('ระบบกำลังปรับปรุงข้อมูลบางส่วน กรุณาลองใหม่อีกครั้งในภายหลัง');
      }

      // Debug logging
      console.log('🔍 Dashboard Debug Info:');
      console.log('📊 Patients Result:', patientsResult.status, patientsData.length, 'patients');
      console.log('📊 Visits Result:', visitsResult.status, visitsData.length, 'visits');
      console.log('📊 Appointments Result:', appointmentsResult.status, appointmentsData.length, 'appointments');
      console.log('📊 Raw Patients Result:', patientsResult);
      console.log('📊 Raw Visits Result:', visitsResult);
      console.log('📊 Patients Data:', patientsData);
      console.log('📊 Visits Data:', visitsData);
      console.log('📊 Filtered visits for doctor:', user?.id, visitsData.length);
      
      // Additional debug for data extraction
      if (patientsResult.status === 'fulfilled') {
        console.log('🔍 Patients Result Value:', patientsResult.value);
        console.log('🔍 Patients Result Data:', patientsResult.value?.data);
        console.log('🔍 Patients Result Data Patients:', patientsResult.value?.data?.patients);
      }
      
      if (visitsResult.status === 'fulfilled') {
        console.log('🔍 Visits Result Value:', visitsResult.value);
        console.log('🔍 Visits Result Data:', visitsResult.value?.data);
        console.log('🔍 Visits Result Data Visits:', visitsResult.value?.data?.visits);
      }
      // Calculate today's patients (patients with visits today by this doctor)
      const today = new Date().toISOString().split('T')[0];
      const todayPatientsCount = visitsData.filter(visit => {
        const isToday = ('visit_date' in visit && visit.visit_date && typeof visit.visit_date === 'string' && visit.visit_date.startsWith(today)) || 
                       ('created_at' in visit && visit.created_at && typeof visit.created_at === 'string' && visit.created_at.startsWith(today));
        return isToday;
      }).length;

      // Calculate total patients for this doctor
      const totalPatientsCount = visitsData.length;

      // Calculate active queues (visits with in_progress status for this doctor)
      const activeQueueCount = visitsData.filter(visit => {
        const isInProgress = 'status' in visit && visit.status === 'in_progress';
        return isInProgress;
      }).length;

      // Calculate completed visits for this doctor
      const completedVisitsCount = visitsData.filter(visit => {
        const isCompleted = 'status' in visit && visit.status === 'completed';
        return isCompleted;
      }).length;

      // Calculate upcoming appointments
      const upcomingAppointmentsCount = appointmentsData.filter(appointment => {
        const isUpcoming = 'status' in appointment && (appointment.status === 'scheduled' || appointment.status === 'confirmed');
        return isUpcoming;
      }).length;
      // Set real stats from actual data
      const todayVisitsCount = visitsData.filter(visit => {
        const isToday = ('visit_date' in visit && visit.visit_date && typeof visit.visit_date === 'string' && visit.visit_date.startsWith(today)) || 
                       ('created_at' in visit && visit.created_at && typeof visit.created_at === 'string' && visit.created_at.startsWith(today));
        return isToday;
      }).length;
      
      const inProgressCount = visitsData.filter(visit => visit.status === 'in_progress').length;
      const completedCount = visitsData.filter(visit => visit.status === 'completed').length;
      
      const finalStats = {
        todayPatients: todayVisitsCount, // Total visits today for this doctor
        todayRegistrations: 0, // New registrations (not applicable for doctor dashboard)
        activeQueues: activeQueueCount, // Active queues (in_progress visits) for this doctor
        completedVisits: completedVisitsCount, // Completed visits for this doctor
        pendingLabs: 0, // Lab results API to be implemented
        upcomingAppointments: upcomingAppointmentsCount, // Upcoming appointments
        activeMedications: 0, // Medications API to be implemented
        criticalAlerts: 0 // Alerts system to be implemented
      };
      
      console.log('📊 Calculated Stats:', finalStats);
      setStats(finalStats);

      // Generate queue data from real visits for this doctor
      const queueData: QueueItem[] = visitsData
        .filter(visit => {
          // Show all visits for this doctor
          return 'visit_date' in visit && 'status' in visit;
        })
        .map(visit => {
          // Type guard to ensure it's a MedicalVisit
          if ('visit_number' in visit && 'status' in visit) {
            // Get patient name from visit data directly (since it's already included in the API response)
            const patientName = visit.patient?.thai_first_name && visit.patient?.thai_last_name 
              ? `${visit.patient.thai_first_name} ${visit.patient.thai_last_name}`
              : visit.patient?.name || 'ไม่ระบุ';
            const hospitalNumber = visit.patient?.hospital_number || visit.patient?.hn || 'ไม่ระบุ';
            
            // Get department from visit data or doctor
            const department = visit.department?.name || 
                              visit.department || 
                              visit.doctor?.department_name || 
                              visit.doctor?.department || 
                              'อายุรกรรม'; // Default to internal medicine
            
            // Calculate wait time based on visit time
            const visitTime = visit.visit_time || '00:00:00';
            const currentTime = new Date();
            
            // Create visit datetime properly
            let visitDateTime;
            try {
              // Try to create date from visit_date and visit_time
              const visitDateStr = visit.visit_date;
              const visitTimeStr = visitTime;
              
              // Handle different date formats
              if (visitDateStr.includes('T')) {
                // Already ISO format
                visitDateTime = new Date(visitDateStr);
              } else {
                // Combine date and time
                visitDateTime = new Date(`${visitDateStr}T${visitTimeStr}`);
              }
              
              // Check if date is valid
              if (isNaN(visitDateTime.getTime())) {
                // Fallback to created_at if visit_date is invalid
                visitDateTime = new Date(visit.created_at || visit.updated_at);
              }
            } catch (error) {
              // Fallback to created_at
              visitDateTime = new Date(visit.created_at || visit.updated_at);
            }
            
            const waitTimeMinutes = Math.floor((currentTime.getTime() - visitDateTime.getTime()) / (1000 * 60));
            let waitTime = Math.max(0, waitTimeMinutes);
            
            // Handle NaN case
            if (isNaN(waitTime)) {
              waitTime = 0;
            }
            
            // Debug logging
            console.log('🕒 Wait Time Calculation:', {
              visitNumber: visit.visit_number,
              visitDate: visit.visit_date,
              visitTime: visit.visit_time,
              visitDateTime: visitDateTime,
              currentTime: currentTime,
              waitTimeMinutes: waitTimeMinutes,
              waitTime: waitTime
            });
            
            const queueItem = {
              id: visit.id,
              queueNumber: (visit.visit_number as string) || `Q${visit.id.slice(-4)}`,
              patientName: `${patientName} (${hospitalNumber})`,
              status: visit.status === 'completed' ? 'completed' as const : 
                      visit.status === 'in_progress' ? 'in_progress' as const : 'waiting' as const,
              department: department,
              waitTime: waitTime,
              priority: visit.priority || 'normal'
            };
            return queueItem;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
      console.log('📊 Queue Data:', queueData);
      setQueues(queueData);

      // Generate recent activities from real data
      const activities: RecentActivity[] = [];
      
      // Add visit activities for this doctor
      visitsData.slice(0, 3).forEach(visit => {
        // Type guard to check if it's a MedicalVisit
        if ('visit_date' in visit && 'status' in visit) {
          // Get patient name from visit data directly
          const patientName = visit.patient?.thai_first_name && visit.patient?.thai_last_name 
            ? `${visit.patient.thai_first_name} ${visit.patient.thai_last_name}`
            : visit.patient?.name || 'ไม่ระบุ';
          const hospitalNumber = visit.patient?.hospital_number || visit.patient?.hn || 'ไม่ระบุ';
          const visitType = visit.visit_type === 'walk_in' ? 'มาโดยไม่นัด' : visit.visit_type === 'appointment' ? 'นัดหมาย' : visit.visit_type || 'ไม่ระบุ';
          const priority = visit.priority === 'normal' ? 'ปกติ' : visit.priority === 'urgent' ? 'ด่วน' : visit.priority === 'high' ? 'สูง' : visit.priority === 'low' ? 'ต่ำ' : visit.priority === 'emergency' ? 'ฉุกเฉิน' : visit.priority || 'ไม่ระบุ';
          
          activities.push({
            id: `visit-${visit.id}`,
            type: 'visit' as const,
            description: `การรักษา: ${patientName} (${hospitalNumber}) - ${visit.visit_number || 'ไม่ระบุ'} | ${visitType} | ${priority} | ${visit.status === 'completed' ? 'เสร็จสิ้น' : visit.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอการรักษา'}`,
            timestamp: visit.updated_at || visit.created_at || new Date().toISOString(),
            user: user?.firstName || 'แพทย์',
            status: visit.status === 'completed' ? 'success' as const : visit.status === 'in_progress' ? 'warning' as const : 'error' as const
          });
        }
      });
      
      // Add patient registration activities
      patientsData.slice(0, 2).forEach(patient => {
        // Type guard to check if it's a MedicalPatient
        if ('firstName' in patient && 'lastName' in patient) {
          activities.push({
            id: `patient-${patient.id}`,
            type: 'registration' as const,
            description: `ลงทะเบียนผู้ป่วยใหม่: ${patient.thaiName || patient.firstName || 'ไม่ระบุ'}`,
            timestamp: patient.created_at || new Date().toISOString(),
            user: 'ระบบ',
            status: 'success' as const
          });
        }
      });
      
      // Add appointment activities
      appointmentsData.slice(0, 2).forEach(appointment => {
        // Type guard to check if it's an Appointment
        if ('title' in appointment && 'status' in appointment) {
          activities.push({
            id: `appointment-${appointment.id}`,
            type: 'appointment' as const,
            description: `นัดหมาย: ${appointment.title || 'ไม่ระบุหัวข้อ'} - ไม่ระบุผู้ป่วย`,
            timestamp: appointment.date || new Date().toISOString(),
            user: appointment.physician?.name || 'แพทย์',
            status: appointment.status === 'confirmed' ? 'success' as const : 'warning' as const
          });
        }
      });
      
      // Sort by timestamp (newest first) and limit to 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const finalActivities = activities.slice(0, 5);
      setRecentActivities(finalActivities);

      // Generate patient-related alerts and notifications
      const alertsData: Alert[] = [];
      
      // Add patient-related alerts based on real data
      if (totalPatientsCount > 0) {
        // Info about total patients for this doctor
        alertsData.push({
          id: '1',
          type: 'info',
          title: 'ข้อมูลผู้ป่วยของคุณ',
          message: `คุณมีผู้ป่วยทั้งหมด ${totalPatientsCount} ราย`,
          timestamp: new Date().toISOString(),
          isRead: false
        });
        
        // Alert for patients with active visits
        if (activeQueueCount > 0) {
          alertsData.push({
            id: '2',
            type: 'warning',
            title: 'ผู้ป่วยรอการรักษา',
            message: `มีผู้ป่วย ${activeQueueCount} รายรอการรักษาจากคุณ`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        
        // Alert for completed visits
        if (completedVisitsCount > 0) {
          alertsData.push({
            id: '3',
            type: 'success',
            title: 'การรักษาเสร็จสิ้น',
            message: `คุณเสร็จสิ้นการรักษา ${completedVisitsCount} ราย`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }

        // Add alerts for new visits today
        if (todayPatientsCount > 0) {
          alertsData.push({
            id: '4',
            type: 'info',
            title: 'การรักษาวันนี้',
            message: `คุณมีการรักษา ${todayPatientsCount} รายวันนี้`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        
        // Add critical alerts based on real data
        if (activeQueueCount > 5) {
          alertsData.push({
            id: '5',
            type: 'critical',
            title: 'คิวรอมาก',
            message: `คุณมีคิวรอ ${activeQueueCount} คิว ควรเร่งดำเนินการ`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        
        if (todayPatientsCount === 0) {
          alertsData.push({
            id: '6',
            type: 'info',
            title: 'ไม่มีการรักษาวันนี้',
            message: 'วันนี้คุณยังไม่มีการรักษาผู้ป่วย',
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        
        // Add appointment alerts
        if (upcomingAppointmentsCount > 0) {
          alertsData.push({
            id: '7',
            type: 'info',
            title: 'นัดหมายถัดไป',
            message: `คุณมีนัดหมาย ${upcomingAppointmentsCount} รายการ`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
      } else {
        // No patients alert
        alertsData.push({
          id: 'no-patients',
          type: 'info',
          title: 'ไม่มีข้อมูลผู้ป่วย',
          message: 'คุณยังไม่มีผู้ป่วยในระบบ',
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
      
      setAlerts(alertsData);

      logger.info('✅ Dashboard data loaded successfully');
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      logger.error('❌ Error loading dashboard data:', err);
      setError(`เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด: ${err.message || 'Unknown error'}`);
      
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
    console.log('🔍 useEffect triggered');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 user:', user);
    console.log('🔍 selectedTimeRange:', selectedTimeRange);
    
    if (isAuthenticated) {
      console.log('✅ Calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('❌ Not authenticated, not calling loadDashboardData');
    }
  }, [selectedTimeRange, isAuthenticated, loadDashboardData]);

  //  logging for stats changes
  useEffect(() => {
    console.log('📊 Stats changed:', stats);
  }, [stats]);

  //  logging for loading state
  useEffect(() => {
    console.log('⏳ Loading state changed:', isLoading);
  }, [isLoading]);

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

  const handleCompleteVisit = async (visitId: string) => {
    try {
      logger.info('Completing visit:', visitId);
      
      const response = await VisitService.completeVisit(visitId);
      
      if (response.statusCode === 200) {
        logger.info('Visit completed successfully');
        // Reload dashboard data to reflect the change
        await loadDashboardData();
      } else {
        logger.error('Failed to complete visit:', response.error);
        alert('เกิดข้อผิดพลาดในการปิดการรักษา');
      }
    } catch (error) {
      logger.error('Error completing visit:', error);
      alert('เกิดข้อผิดพลาดในการปิดการรักษา');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration': return <UserPlus className="h-4 w-4" />;
      case 'visit': return <Activity className="h-4 w-4" />;
      case 'lab': return <FileText className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      case 'discharge': return <CheckCircle className="h-4 w-4" />;
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
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard EMR - ผู้ป่วย</h1>
              <p className="text-sm md:text-base text-gray-600">ภาพรวมข้อมูลผู้ป่วยและกิจกรรมที่เกี่ยวข้อง</p>
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
              {queues.filter(queue => queue.status === 'in_progress').map((queue) => (
                <div key={queue.id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className={`px-3 py-2 rounded-lg text-sm font-bold ${getStatusColor(queue.priority)} flex-shrink-0`}>
                      {queue.queueNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{queue.patientName}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">แผนก: {queue.department}</p>
                      <p className="text-xs text-gray-500 truncate">ความสำคัญ: {queue.priority === 'normal' ? 'ปกติ' : queue.priority === 'urgent' ? 'ด่วน' : queue.priority === 'high' ? 'สูง' : queue.priority === 'low' ? 'ต่ำ' : queue.priority === 'emergency' ? 'ฉุกเฉิน' : queue.priority}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(queue.status)}`}>
                      กำลังตรวจ
                    </div>
                    <p className="text-xs text-gray-500 mt-1">คิว: {queue.queueNumber}</p>
                    <button
                      onClick={() => handleCompleteVisit(queue.id)}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
              {queues.filter(queue => queue.status === 'in_progress').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>ไม่มีคิวที่กำลังดำเนินการ</p>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">คิวรอตรวจ</h2>
              <Link href="/emr/checkin" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                ดูทั้งหมด <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {queues.filter(queue => queue.status === 'waiting').map((queue) => (
                <div key={queue.id} className="flex items-center justify-between p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className={`px-3 py-2 rounded-lg text-sm font-bold ${getStatusColor(queue.priority)} flex-shrink-0`}>
                      {queue.queueNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{queue.patientName}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">แผนก: {queue.department}</p>
                      <p className="text-xs text-gray-500 truncate">ความสำคัญ: {queue.priority === 'normal' ? 'ปกติ' : queue.priority === 'urgent' ? 'ด่วน' : queue.priority === 'high' ? 'สูง' : queue.priority === 'low' ? 'ต่ำ' : queue.priority === 'emergency' ? 'ฉุกเฉิน' : queue.priority}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(queue.status)}`}>
                      รอตรวจ
                    </div>
                    <p className="text-xs text-gray-500 mt-1">คิว: {queue.queueNumber}</p>
                    <button
                      onClick={() => handleCompleteVisit(queue.id)}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
              {queues.filter(queue => queue.status === 'waiting').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>ไม่มีคิวรอตรวจ</p>
                </div>
              )}
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
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'success' ? 'bg-green-100' :
                    activity.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.user}
                      </span>
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
