'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
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
  date: string;
  time: string;
  doctor: string;
  department: string;
  location: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          const response = await apiClient.getPatientAppointments(user.id);
          if (response.success && response.data) {
            setAppointments(response.data);
          } else {
            setError(response.error?.message || "ไม่สามารถดึงข้อมูลนัดหมายได้");
          }
        }
        
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลนัดหมาย');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAppointments();
    }
  }, [user]);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesType = filterType === 'all' || appointment.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-700" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-700" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'scheduled':
        return 'จองแล้ว';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return 'ไม่ทราบ';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="การนัดหมาย" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การนัดหมาย</h1>
            <p className="text-gray-800 mt-1">
              จัดการการนัดหมายกับแพทย์และการตรวจสอบ
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            จองนัดหมายใหม่
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาแพทย์, แผนก, หรือประเภทการนัด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="scheduled">จองแล้ว</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทุกประเภท</option>
                <option value="ตรวจประจำ">ตรวจประจำ</option>
                <option value="ตรวจเฉพาะ">ตรวจเฉพาะ</option>
                <option value="ตรวจติดตาม">ตรวจติดตาม</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="grid gap-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีการนัดหมาย</h3>
                <p className="text-gray-600 mb-4">คุณยังไม่มีการนัดหมายในระบบ</p>
                <Button>
                  จองนัดหมายใหม่
                </Button>
              </CardContent>
            </Card>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700">ไม่มีการนัดหมายที่ตรงกับเงื่อนไขการค้นหา</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appointment.status)}
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-700">
                          {new Date(appointment.date).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-700" />
                            <span className="font-medium">{appointment.doctor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-700" />
                            <span className="text-sm text-gray-800">{appointment.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-700" />
                            <span className="text-sm text-gray-800">{appointment.location}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-700" />
                            <span className="text-sm text-gray-800">{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-700" />
                            <span className="text-sm text-gray-800">{appointment.type}</span>
                          </div>
                          {appointment.notes && (
                            <div className="text-sm text-gray-800">
                              <span className="font-medium">หมายเหตุ:</span> {appointment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {appointment.status === 'scheduled' && (
                        <Button size="sm" variant="outline">
                          ยืนยัน
                        </Button>
                      )}
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          ยกเลิก
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </div>
            <p className="text-sm text-gray-800">จองแล้ว</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'confirmed').length}
            </div>
            <p className="text-sm text-gray-800">ยืนยันแล้ว</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-800">เสร็จสิ้น</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.status === 'cancelled').length}
            </div>
            <p className="text-sm text-gray-800">ยกเลิก</p>
          </CardContent>
        </Card>
      </div>
      </div>
    </AppLayout>
  );
};

export default PatientAppointments;
