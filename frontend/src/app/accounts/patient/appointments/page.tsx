"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { logger } from '@/lib/logger';
import { 
  Calendar, 
  MapPin, 
  Search, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  User,
  Clock
} from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  patientId: string;
  doctorId?: string;
  notes?: string;
  
  // Optional fields for display
  doctor?: string;
  department?: string;
  location?: string;
  date?: string;
  time?: string;
}

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        return;
      }

      // Fetch real appointments from API
      const response = await apiClient.getPatientAppointments(user.id);
      
      logger.info('API Response:', { statusCode: response.statusCode, data: response.data, error: response.error });
      
      if (response.statusCode === 200) {
        // Extract appointments from the nested data structure
        const appointmentsData = (response.data as any)?.appointments || [];
        
        // Map API data to component interface
        const mappedAppointments = appointmentsData.map((apt: any) => ({
          ...apt,
          date: apt.appointment_date || apt.appointmentDate || apt.date,
          time: apt.appointment_time || apt.appointmentTime || apt.time,
          doctor: apt.physician?.name || apt.doctor || 'ไม่ระบุ',
          department: apt.appointment_type || apt.appointmentType || apt.department || 'ไม่ระบุ',
          location: apt.location || 'ไม่ระบุ'
        }));
        
        setAppointments(mappedAppointments);
        logger.info('Appointments fetched successfully', { count: mappedAppointments.length });
      } else {
        // Handle API error
        const errorMessage = response.error?.message || 'ไม่สามารถดึงข้อมูลการนัดหมายได้';
        setError(errorMessage);
        setAppointments([]);
        logger.warn('API returned error:', { statusCode: response.statusCode, error: response.error });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย';
      setError(errorMessage);
      logger.error('Failed to fetch appointments', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = (appointment.doctor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (appointment.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (appointment.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">นัดแล้ว</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ยกเลิก</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <AppLayout title="การนัดหมาย" userType="patient">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลการนัดหมาย...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="การนัดหมาย" userType="patient">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAppointments} className="bg-blue-600 hover:bg-blue-700">
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="การนัดหมาย" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">การนัดหมาย</h1>
              <p className="text-gray-600 mt-1">
                จัดการการนัดหมายกับแพทย์และการตรวจสอบ
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Calendar className="h-4 w-4" />
              จองนัดหมายใหม่
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อแพทย์หรือแผนก..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'scheduled' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                นัดแล้ว
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'completed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                เสร็จสิ้น
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'cancelled' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบการนัดหมาย</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'ไม่พบการนัดหมายที่ตรงกับเงื่อนไขการค้นหา' 
                  : 'คุณยังไม่มีนัดหมายใดๆ'}
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(appointment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.doctor}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <p className="text-gray-600 mb-1">{appointment.department}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {appointment.status === 'scheduled' && (
                      <>
                        <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                          แก้ไข
                        </button>
                        <button className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          ยกเลิก
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </div>
            <p className="text-sm text-gray-600">นัดแล้ว</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">เสร็จสิ้น</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.status === 'cancelled').length}
            </div>
            <p className="text-sm text-gray-600">ยกเลิก</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientAppointments;