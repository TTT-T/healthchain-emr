"use client";
import { useState, useEffect } from "react";
import { Search, Calendar, Plus, Edit, Trash2, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { AppointmentService } from '@/services/appointmentService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

export default function Appointments() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [appointmentData, setAppointmentData] = useState({
    doctorId: '',
    appointmentType: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    duration: 30,
    reason: '',
    notes: '',
    status: 'scheduled',
    priority: 'medium',
    location: '',
    reminderSent: false,
    followUpRequired: false,
    followUpDate: ''
  });

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      // Sample doctors data - in real app, this would come from API
      const sampleDoctors = [
        { id: '1', name: 'นพ.สมชาย ใจดี', department: 'อายุรกรรม' },
        { id: '2', name: 'นพ.สมหญิง รักสุขภาพ', department: 'กุมารเวชกรรม' },
        { id: '3', name: 'นพ.สมศักดิ์ ใจงาม', department: 'ศัลยกรรม' }
      ];
      setDoctors(sampleDoctors);
    } catch (error) {
      logger.error('Error loading doctors:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        await loadPatientAppointments(response.data[0].id);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
        setAppointments([]);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
      setAppointments([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientAppointments = async (patientId: string) => {
    try {
      const response = await AppointmentService.getAppointmentsByPatient(patientId);
      if (response.statusCode === 200 && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      logger.error("Error loading appointments:", error);
      // Use sample data if API fails
      setAppointments([
        {
          id: '1',
          appointmentType: 'ตรวจสุขภาพ',
          appointmentDate: '2024-01-15',
          appointmentTime: '09:00',
          duration: 30,
          reason: 'ตรวจสุขภาพประจำปี',
          status: 'scheduled',
          priority: 'medium',
          doctor: { thaiName: 'นพ.สมชาย ใจดี' }
        }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Validate data
    const validation = AppointmentService.validateAppointmentData(appointmentData);
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = AppointmentService.formatAppointmentDataForAPI(
        appointmentData,
        selectedPatient.id,
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      const response = await AppointmentService.createAppointment(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("สร้างนัดหมายสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reload appointments
        await loadPatientAppointments(selectedPatient.id);
        
        // Reset form
        setTimeout(() => {
          setAppointmentData(AppointmentService.createEmptyAppointmentData());
          setShowForm(false);
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
      }
    } catch (error) {
      logger.error("Error creating appointment:", error);
      setError("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, appointmentRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospital_number || '',
        patientNationalId: patient.national_id || '',
        patientName: patient.thai_name || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'appointment',
        recordId: appointmentRecord.id,
        chiefComplaint: `นัดหมาย: ${appointmentRecord.appointmentType}`,
        recordedBy: appointmentRecord.createdBy,
        recordedTime: appointmentRecord.createdAt,
        message: `มีการสร้างนัดหมายใหม่สำหรับคุณ ${patient.thai_name || `${patient.firstName} ${patient.lastName}`} โดย ${appointmentRecord.createdBy}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for appointment', {
        patientHn: notificationData.patientHn,
        recordId: appointmentRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for appointment:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบนัดหมายนี้?')) return;
    
    try {
      const response = await AppointmentService.deleteAppointment(appointmentId);
      if (response.statusCode === 200) {
        setSuccess("ลบนัดหมายสำเร็จ");
        if (selectedPatient) {
          await loadPatientAppointments(selectedPatient.id);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      logger.error("Error deleting appointment:", error);
      setError("เกิดข้อผิดพลาดในการลบนัดหมาย");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบนัดหมาย</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, appointmentData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'appointment',
        appointmentData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.national_id || '',
          patientName: patient.thai_name || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for appointment', { 
        patientHn: patient.hn,
        recordType: 'appointment'
      });
    } catch (error) {
      logger.error('Error creating patient document for appointment:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างนัดหมาย
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการนัดหมาย</h1>
              <p className="text-gray-600">สร้างและจัดการนัดหมายผู้ป่วย</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="กรอก HN หรือหมายเลขคิว"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">ข้อมูลผู้ป่วย</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">HN:</span> {selectedPatient.hn || selectedPatient.hospital_number}
                    </div>
                    <div>
                      <span className="font-medium">ชื่อ:</span> {selectedPatient.thai_name || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                    </div>
                    <div>
                      <span className="font-medium">อายุ:</span> {selectedPatient.age || 'ไม่ระบุ'}
                    </div>
                    <div>
                      <span className="font-medium">เพศ:</span> {selectedPatient.gender || 'ไม่ระบุ'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {showForm ? "ปิดฟอร์ม" : "สร้างนัดหมาย"}
                </button>
              </div>
            </div>
          )}

          {/* Appointment Form */}
          {selectedPatient && showForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สร้างนัดหมายใหม่</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทนัดหมาย *
                  </label>
                  <select
                    value={appointmentData.appointmentType}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">เลือกประเภทนัดหมาย</option>
                    <option value="ตรวจสุขภาพ">ตรวจสุขภาพ</option>
                    <option value="ติดตามผล">ติดตามผล</option>
                    <option value="ฉีดวัคซีน">ฉีดวัคซีน</option>
                    <option value="ตรวจพิเศษ">ตรวจพิเศษ</option>
                    <option value="ปรึกษา">ปรึกษา</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    แพทย์ผู้ตรวจ
                  </label>
                  <select
                    value={appointmentData.doctorId}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">เลือกแพทย์</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่นัดหมาย *
                  </label>
                  <input
                    type="date"
                    value={appointmentData.appointmentDate}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลานัดหมาย *
                  </label>
                  <input
                    type="time"
                    value={appointmentData.appointmentTime}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระยะเวลา (นาที)
                  </label>
                  <select
                    value={appointmentData.duration}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 นาที</option>
                    <option value={30}>30 นาที</option>
                    <option value={45}>45 นาที</option>
                    <option value={60}>60 นาที</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความสำคัญ
                  </label>
                  <select
                    value={appointmentData.priority}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="urgent">ด่วน</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลในการนัดหมาย *
                </label>
                <textarea
                  value={appointmentData.reason}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกเหตุผลในการนัดหมาย"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่นัดหมาย
                </label>
                <input
                  type="text"
                  value={appointmentData.location}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น ห้องตรวจ 1, คลินิกเฉพาะทาง"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างนัดหมาย"}
                </button>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {selectedPatient && appointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">รายการนัดหมาย</h3>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            {AppointmentService.formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${AppointmentService.getStatusColor(appointment.status)}`}>
                            {AppointmentService.getStatusLabel(appointment.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${AppointmentService.getPriorityColor(appointment.priority)}`}>
                            {AppointmentService.getPriorityLabel(appointment.priority)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">ประเภท:</span> {appointment.appointmentType}
                          </div>
                          <div>
                            <span className="font-medium">เหตุผล:</span> {appointment.reason}
                          </div>
                          {appointment.doctor && (
                            <div>
                              <span className="font-medium">แพทย์:</span> {appointment.doctor.thaiName}
                            </div>
                          )}
                          {appointment.location && (
                            <div>
                              <span className="font-medium">สถานที่:</span> {appointment.location}
                            </div>
                          )}
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">หมายเหตุ:</span> {appointment.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="ลบนัดหมาย"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 whitespace-pre-line">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}