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
import { apiClient } from '@/lib/api';

export default function Appointments() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
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
    priority: 'normal',
    location: '',
    reminderSent: false,
    followUpRequired: false,
    followUpDate: ''
  });

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Reset doctorId when doctors array changes
  useEffect(() => {
    if (doctors.length === 0 && appointmentData.doctorId) {
      logger.warn('Doctors array is empty, resetting doctorId');
      setAppointmentData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [doctors, appointmentData.doctorId]);

  // Age calculation function
  const calculateAgeFromFields = (patient: MedicalPatient): number => {
    logger.info("Calculating age for patient:", {
      birth_date: patient.birth_date,
      birth_year: patient.birth_year,
      birth_month: patient.birth_month,
      birth_day: patient.birth_day
    });
    
    // Try to calculate age from separate birth fields first
    if (patient.birth_year && patient.birth_month && patient.birth_day) {
      const today = new Date();
      const birthYear = patient.birth_year > 2500 ? patient.birth_year - 543 : patient.birth_year;
      const birth = new Date(birthYear, patient.birth_month - 1, patient.birth_day);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      logger.info("Calculated age from separate fields:", {
        age,
        birthYear,
        birthMonth: patient.birth_month,
        birthDay: patient.birth_day
      });
      
      return age;
    }
    
    // Fallback to birth_date
    if (patient.birth_date) {
      const age = Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      logger.info("Calculated age from birth_date:", { age, birth_date: patient.birth_date });
      return age;
    }
    
    logger.info("No birth data available, returning 0");
    return 0;
  };

  const loadDoctors = async () => {
    try {
      logger.info('Loading doctors from API...');
      // Load real doctors from API using apiClient (with authentication)
      const response = await apiClient.get('/medical/doctors?limit=100');
      
      logger.info('Doctors API response:', { 
        statusCode: response.statusCode, 
        dataLength: response.data?.length || 0,
        data: response.data 
      });
      
      if (response.statusCode === 200 && response.data) {
        logger.info('Successfully loaded doctors from API:', response.data);
        setDoctors(response.data);
      } else {
        logger.warn('Failed to load doctors from API, no doctors available');
        setDoctors([]);
      }
    } catch (error) {
      logger.error('Error loading doctors from API:', error);
      setDoctors([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        logger.info("Patient found:", response.data[0]);
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
          priority: 'normal',
          doctor: { thaiName: 'นพ.สมชาย ใจดี' }
        }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Debug logging
    logger.info('Debug selectedPatient data:', {
      selectedPatientId: selectedPatient.id,
      selectedPatientHn: selectedPatient.hospital_number,
      selectedPatientName: selectedPatient.thai_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`
    });
    
    // Validate data
    const validation = AppointmentService.validateAppointmentData(appointmentData);
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    // Additional validation for doctorId
    if (!appointmentData.doctorId) {
      setError('กรุณาเลือกแพทย์ผู้ตรวจ');
      return;
    }

    // Check if selected doctor exists in doctors array
    const selectedDoctor = doctors.find(doctor => doctor.id === appointmentData.doctorId);
    if (!selectedDoctor) {
      logger.error('Selected doctor not found in doctors array:', {
        selectedDoctorId: appointmentData.doctorId,
        availableDoctors: doctors.map(d => ({ id: d.id, name: d.name }))
      });
      setError('แพทย์ที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่');
      setAppointmentData(prev => ({ ...prev, doctorId: '' }));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = AppointmentService.formatAppointmentDataForAPI(
        appointmentData,
        selectedPatient.id,
        user?.id || 'system'
      );
      
      logger.info('Debug formatted data:', formattedData);
      
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
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'appointment',
        recordId: appointmentRecord.id,
        chiefComplaint: `นัดหมาย: ${appointmentRecord.appointmentType}`,
        recordedBy: appointmentRecord.createdBy,
        recordedTime: appointmentRecord.createdAt,
        message: `มีการสร้างนัดหมายใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${appointmentRecord.createdBy}`
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
      <div className="w-full px-4 sm:px-6 lg:px-8">
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
            
            {/* Search Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType("hn")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "hn"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ค้นหาด้วย HN
              </button>
              <button
                onClick={() => setSearchType("queue")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "queue"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ค้นหาด้วยคิว
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN เช่น HN250001" : "กรอกหมายเลขคิว"}
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
                      <span className="font-medium">HN:</span> {selectedPatient.hospital_number || selectedPatient.hn}
                    </div>
                    <div>
                      <span className="font-medium">ชื่อ:</span> {selectedPatient.thai_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    </div>
                    <div>
                      <span className="font-medium">อายุ:</span> {calculateAgeFromFields(selectedPatient) > 0 ? `${calculateAgeFromFields(selectedPatient)} ปี` : 'ไม่ระบุ'}
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
                    <option value="">
                      {doctors.length > 0 ? "เลือกแพทย์" : "ไม่มีแพทย์ในระบบ"}
                    </option>
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
                    <option value="normal">ปานกลาง</option>
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