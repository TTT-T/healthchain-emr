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
  Clock,
  FileText,
  MessageSquare,
  Clipboard,
  StickyNote,
  Tag,
  AlertTriangle,
  Timer,
  RefreshCw,
  Edit
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
  preparations?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  duration?: number;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  created_at?: string;
  updated_at?: string;
}

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  // Error boundary fallback
  if (!user) {
    return (
      <AppLayout title="การนัดหมาย" userType="patient">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบข้อมูลผู้ใช้</h3>
            <p className="text-gray-600">กรุณาเข้าสู่ระบบใหม่</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setAppointments([]);
        return;
      }

      // Fetch real appointments from API
      const response = await apiClient.getPatientAppointments(user.id);
      
      logger.info('API Response:', { statusCode: response.statusCode, data: response.data, error: response.error });
      
      if (response.statusCode === 200) {
        try {
          // Extract appointments from the nested data structure
          const responseData = response.data as any;
          const appointmentsData = responseData?.appointments || responseData || [];
          
          // Ensure appointmentsData is an array
          if (!Array.isArray(appointmentsData)) {
            logger.warn('Appointments data is not an array:', appointmentsData);
            setAppointments([]);
            return;
          }
          
          // Map API data to component interface
          const mappedAppointments = appointmentsData.map((apt: any) => {
            // Handle location object
            let locationString = 'ไม่ระบุ';
            if (apt.location) {
              if (typeof apt.location === 'string') {
                locationString = apt.location;
              } else if (typeof apt.location === 'object' && apt.location.name) {
                locationString = apt.location.name;
              } else if (typeof apt.location === 'object') {
                locationString = JSON.stringify(apt.location);
              }
            }

            // Handle physician object
            let doctorName = 'ไม่ระบุ';
            if (apt.physician) {
              if (typeof apt.physician === 'string') {
                doctorName = apt.physician;
              } else if (typeof apt.physician === 'object' && apt.physician.name) {
                doctorName = apt.physician.name;
              }
            } else if (apt.doctor) {
              doctorName = apt.doctor;
            }

            // Handle preparations array/object
            let preparationsString = '';
            if (apt.preparations) {
              if (Array.isArray(apt.preparations)) {
                preparationsString = apt.preparations.join(', ');
              } else if (typeof apt.preparations === 'string') {
                preparationsString = apt.preparations;
              } else if (typeof apt.preparations === 'object') {
                preparationsString = JSON.stringify(apt.preparations);
              }
            }

            return {
              ...apt,
              date: apt.appointmentDate || apt.appointmentDate || apt.date,
              time: apt.appointment_time || apt.appointmentTime || apt.time,
              doctor: doctorName,
              department: apt.appointment_type || apt.appointmentType || apt.department || 'ไม่ระบุ',
              location: locationString,
              preparations: preparationsString,
              priority: apt.priority || 'normal',
              duration: apt.duration,
              follow_up_required: apt.follow_up_required,
              follow_up_date: apt.follow_up_date,
              follow_up_notes: apt.follow_up_notes,
              created_at: apt.created_at,
              updated_at: apt.updated_at
            };
          });
          
          setAppointments(mappedAppointments);
          logger.info('Appointments fetched successfully', { count: mappedAppointments.length, responseData });
        } catch (mappingError) {
          logger.error('Error mapping appointments data:', mappingError);
          setError('เกิดข้อผิดพลาดในการประมวลผลข้อมูลการนัดหมาย');
          setAppointments([]);
        }
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
      setAppointments([]);
      logger.error('Failed to fetch appointments', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = (appointments || []).filter(appointment => {
    if (!appointment) return false;
    
    const doctorName = typeof appointment.doctor === 'string' ? appointment.doctor : '';
    const departmentName = typeof appointment.department === 'string' ? appointment.department : '';
    const titleName = typeof appointment.title === 'string' ? appointment.title : '';
    const appointmentStatus = typeof appointment.status === 'string' ? appointment.status : '';
    
    const matchesSearch = doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         titleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointmentStatus === statusFilter;
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
              {(appointments || []).length > 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  <span>พบการนัดหมายทั้งหมด: {(appointments || []).length} รายการ</span>
                  {filteredAppointments.length !== (appointments || []).length && (
                    <span className="ml-2">| แสดง: {filteredAppointments.length} รายการ</span>
                  )}
                </div>
              )}
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
                  placeholder="ค้นหาการนัดหมาย (แพทย์, ประเภท, หัวข้อ)..."
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
          
          {/* Search Results Summary */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>
                    {searchTerm ? `ค้นหา: "${searchTerm}"` : ''}
                    {searchTerm && statusFilter !== 'all' ? ' | ' : ''}
                    {statusFilter !== 'all' ? `สถานะ: ${statusFilter === 'scheduled' ? 'นัดแล้ว' : statusFilter === 'completed' ? 'เสร็จสิ้น' : statusFilter === 'cancelled' ? 'ยกเลิก' : statusFilter}` : ''}
                  </span>
                </div>
                <div className="text-gray-500">
                  ผลลัพธ์: {filteredAppointments.length} รายการ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบการนัดหมาย</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'ไม่พบการนัดหมายที่ตรงกับเงื่อนไขการค้นหา' 
                  : 'คุณยังไม่มีนัดหมายใดๆ'}
              </p>
              {(appointments || []).length > 0 && (
                <div className="text-sm text-gray-500">
                  <p>พบการนัดหมายทั้งหมด: {(appointments || []).length} รายการ</p>
                  <p>กรองแล้ว: {filteredAppointments.length} รายการ</p>
                </div>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              if (!appointment || !appointment.id) return null;
              
              return (
                <div key={appointment.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(typeof appointment.status === 'string' ? appointment.status : 'unknown')}
                      </div>
                      <div className="flex-1">
                        {/* Appointment ID and Status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-500">
                            ID: {appointment.id.slice(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.created_at && (
                              <span>สร้างเมื่อ: {new Date(appointment.created_at).toLocaleString('th-TH')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {typeof appointment.doctor === 'string' ? appointment.doctor : 'ไม่ระบุ'}
                            </h3>
                            {getStatusBadge(typeof appointment.status === 'string' ? appointment.status : 'unknown')}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              {typeof appointment.department === 'string' ? appointment.department : 'ไม่ระบุ'}
                            </p>
                            {appointment.priority && (
                              <p className={`text-xs px-2 py-1 rounded-full ${
                                appointment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                appointment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                appointment.priority === 'normal' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.priority === 'urgent' ? 'ด่วนมาก' :
                                 appointment.priority === 'high' ? 'สูง' :
                                 appointment.priority === 'normal' ? 'ปกติ' :
                                 appointment.priority === 'low' ? 'ต่ำ' : 'ไม่ระบุ'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">วันที่:</span>
                            <span>{typeof appointment.date === 'string' ? appointment.date : 'ไม่ระบุ'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="font-medium">เวลา:</span>
                            <span>{typeof appointment.time === 'string' ? appointment.time : 'ไม่ระบุ'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="font-medium">สถานที่:</span>
                            <span>{typeof appointment.location === 'string' ? appointment.location : 'ไม่ระบุ'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">แพทย์:</span>
                            <span>{typeof appointment.doctor === 'string' ? appointment.doctor : 'ไม่ระบุ'}</span>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="mt-4 space-y-2">
                          {appointment.title && typeof appointment.title === 'string' && (
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-indigo-500 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">หัวข้อ:</span>
                                <p className="text-sm text-gray-600">{appointment.title}</p>
                              </div>
                            </div>
                          )}
                          
                          {appointment.description && typeof appointment.description === 'string' && (
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-orange-500 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">รายละเอียด:</span>
                                <p className="text-sm text-gray-600">{appointment.description}</p>
                              </div>
                            </div>
                          )}

                          {appointment.preparations && typeof appointment.preparations === 'string' && appointment.preparations.trim() && (
                            <div className="flex items-start space-x-2">
                              <Clipboard className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">การเตรียมตัว:</span>
                                <p className="text-sm text-gray-600">{appointment.preparations}</p>
                              </div>
                            </div>
                          )}

                          {appointment.notes && typeof appointment.notes === 'string' && (
                            <div className="flex items-start space-x-2">
                              <StickyNote className="h-4 w-4 text-pink-500 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">หมายเหตุ:</span>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mt-1">{appointment.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Appointment Type and Priority */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-teal-500" />
                              <span className="font-medium text-gray-700">ประเภท:</span>
                              <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs">
                                {typeof appointment.department === 'string' ? appointment.department : 'ไม่ระบุ'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-gray-700">ความสำคัญ:</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                appointment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                appointment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                appointment.priority === 'normal' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.priority === 'urgent' ? 'ด่วนมาก' :
                                 appointment.priority === 'high' ? 'สูง' :
                                 appointment.priority === 'normal' ? 'ปกติ' :
                                 appointment.priority === 'low' ? 'ต่ำ' : 'ไม่ระบุ'}
                              </span>
                            </div>
                          </div>

                          {/* Duration and Follow-up */}
                          {(appointment.duration || appointment.follow_up_required) && (
                            <div className="flex items-center space-x-4 text-sm">
                              {appointment.duration && (
                                <div className="flex items-center space-x-2">
                                  <Timer className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium text-gray-700">ระยะเวลา:</span>
                                  <span>{appointment.duration} นาที</span>
                                </div>
                              )}
                              {appointment.follow_up_required && (
                                <div className="flex items-center space-x-2">
                                  <RefreshCw className="h-4 w-4 text-green-500" />
                                  <span className="font-medium text-gray-700">นัดติดตาม:</span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">จำเป็น</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Follow-up Date */}
                          {appointment.follow_up_date && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-indigo-500" />
                              <span className="font-medium text-gray-700">นัดติดตาม:</span>
                              <span>{appointment.follow_up_date}</span>
                            </div>
                          )}

                          {/* Follow-up Notes */}
                          {appointment.follow_up_notes && typeof appointment.follow_up_notes === 'string' && (
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-indigo-500 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">หมายเหตุการติดตาม:</span>
                                <p className="text-sm text-gray-600 bg-indigo-50 p-2 rounded-lg mt-1">{appointment.follow_up_notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Created and Updated Dates */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t">
                            {appointment.created_at && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>สร้างเมื่อ: {new Date(appointment.created_at).toLocaleString('th-TH')}</span>
                              </div>
                            )}
                            {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
                              <div className="flex items-center space-x-1">
                                <Edit className="h-3 w-3" />
                                <span>อัปเดตเมื่อ: {new Date(appointment.updated_at).toLocaleString('th-TH')}</span>
                              </div>
                            )}
                            {appointment.patientId && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>ผู้ป่วย: {appointment.patientId.slice(0, 8)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {(typeof appointment.status === 'string' && appointment.status === 'scheduled') && (
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
                      
                      {/* Additional Info */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {appointment.priority && (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>ความสำคัญ: {
                              appointment.priority === 'urgent' ? 'ด่วนมาก' :
                              appointment.priority === 'high' ? 'สูง' :
                              appointment.priority === 'normal' ? 'ปกติ' :
                              appointment.priority === 'low' ? 'ต่ำ' : 'ไม่ระบุ'
                            }</span>
                          </div>
                        )}
                        {appointment.duration && (
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3" />
                            <span>ระยะเวลา: {appointment.duration} นาที</span>
                          </div>
                        )}
                        {appointment.follow_up_required && (
                          <div className="flex items-center space-x-1">
                            <RefreshCw className="h-3 w-3" />
                            <span>นัดติดตาม: จำเป็น</span>
                          </div>
                        )}
                        {appointment.doctorId && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>แพทย์ ID: {appointment.doctorId.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(appointments || []).filter(a => a && typeof a.status === 'string' && a.status === 'scheduled').length}
            </div>
            <p className="text-sm text-gray-600">นัดแล้ว</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {(appointments || []).filter(a => a && typeof a.status === 'string' && a.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">เสร็จสิ้น</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {(appointments || []).filter(a => a && typeof a.status === 'string' && a.status === 'cancelled').length}
            </div>
            <p className="text-sm text-gray-600">ยกเลิก</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(appointments || []).filter(a => a && a.follow_up_required).length}
            </div>
            <p className="text-sm text-gray-600">นัดติดตาม</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(appointments || []).filter(a => a && a.priority === 'urgent').length}
            </div>
            <p className="text-sm text-gray-600">ด่วนมาก</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientAppointments;