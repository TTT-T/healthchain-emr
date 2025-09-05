"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Search, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { VisitService } from '@/services/visitService';
import { apiClient } from '@/lib/api';

interface Patient {
  hn: string;
  nationalId: string;
  thaiName: string;
  gender: string;
  birthDate: string;
  queueNumber: string;
  treatmentType: string;
  assignedDoctor: string;
}

interface Appointment {
  appointmentId: string;
  patient: Patient;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  department: string;
  doctor: string;
  notes: string;
  createdBy: string;
  createdDate: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
}

export default function Appointments() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    appointmentType: "",
    department: "OPD",
    doctor: "",
    notes: ""
  });

  const [errors, setErrors] = useState<any>({});
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const appointmentTypes = [
    { value: "follow_up", label: "ตรวจซ้ำ", description: "นัดตรวจติดตามอาการ" },
    { value: "result_check", label: "ฟังผลตรวจ", description: "นัดฟังผลการตรวจทางห้องปฏิบัติการ" },
    { value: "medication_review", label: "ปรับยา", description: "นัดปรับเปลี่ยนยาหรือตรวจสอบการใช้ยา" },
    { value: "procedure", label: "หัตถการ", description: "นัดทำหัตถการหรือการรักษาพิเศษ" },
    { value: "consultation", label: "ปรึกษาแพทย์เฉพาะทาง", description: "นัดพบแพทย์ผู้เชี่ยวชาญ" },
    { value: "health_check", label: "ตรวจสุขภาพ", description: "นัดตรวจสุขภาพประจำปี" }
  ];

  const doctors = [
    "นพ.สมชาย วงศ์แพทย์",
    "นพ.สมศักดิ์ รักษาดี",
    "พญ.สุมาลี ใจบุญ",
    "นพ.วิชัย เก่งการแพทย์",
    "พญ.นิตยา ชำนาญการ"
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('กรุณากรอกข้อมูลที่ต้องการค้นหา');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`🔍 Searching for patient by ${searchType}:`, searchQuery);
      
      // Use real API call
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.data && response.data.length > 0) {
        const patient = response.data[0];
        
        // Convert MedicalPatient to Patient format
        const convertedPatient: Patient = {
          hn: patient.hn,
          nationalId: patient.national_id || '',
          thaiName: patient.thai_name || 'ไม่ระบุชื่อ',
          gender: patient.gender || 'ไม่ระบุ',
          birthDate: patient.birth_date || '',
          queueNumber: 'Q001', // Default queue number
          treatmentType: 'OPD - ตรวจรักษาทั่วไป', // Default treatment type
          assignedDoctor: 'นพ.สมชาย วงศ์แพทย์' // Default doctor
        };
        
        setSelectedPatient(convertedPatient);
        setAppointmentForm(prev => ({
          ...prev,
          doctor: convertedPatient.assignedDoctor
        }));
        
        setSuccess('พบข้อมูลผู้ป่วยแล้ว');
      } else {
        setError('ไม่พบข้อมูลผู้ป่วยที่ค้นหา');
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('❌ Error searching patient:', error);
      setError('เกิดข้อผิดพลาดในการค้นหา');
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAppointmentForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!selectedPatient) {
      alert("กรุณาเลือกผู้ป่วย");
      return false;
    }

    // Required fields
    if (!appointmentForm.appointmentDate) newErrors.appointmentDate = "กรุณาเลือกวันที่นัด";
    if (!appointmentForm.appointmentTime) newErrors.appointmentTime = "กรุณาเลือกเวลานัด";
    if (!appointmentForm.appointmentType) newErrors.appointmentType = "กรุณาเลือกประเภทการนัด";
    if (!appointmentForm.doctor) newErrors.doctor = "กรุณาเลือกแพทย์";

    // Validate appointment date (must be future date)
    if (appointmentForm.appointmentDate) {
      const appointmentDateTime = new Date(`${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`);
      const now = new Date();
      if (appointmentDateTime <= now) {
        newErrors.appointmentDate = "วันเวลานัดต้องเป็นอนาคต";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Generate appointment ID
      const appointmentId = `APT${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      
      const newAppointment: Appointment = {
        appointmentId,
        patient: selectedPatient!,
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        appointmentType: appointmentForm.appointmentType,
        department: appointmentForm.department,
        doctor: appointmentForm.doctor,
        notes: appointmentForm.notes,
        createdBy: user?.thai_name || "พยาบาลสมหญิง",
        createdDate: new Date().toISOString(),
        status: "scheduled"
      };

      console.log("📅 Creating appointment:", newAppointment);
      
      // For now, just simulate success since we don't have appointment API yet
      // TODO: Replace with real API call when appointment endpoint is available
      // await apiClient.createAppointment(newAppointment);
      
      setCreatedAppointment(newAppointment);
      setSuccess(`สร้างใบนัดสำเร็จ! หมายเลขนัด: ${appointmentId}`);
      
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewAppointment = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    setAppointmentForm({
      appointmentDate: "",
      appointmentTime: "",
      appointmentType: "",
      department: "OPD",
      doctor: "",
      notes: ""
    });
    setCreatedAppointment(null);
    setErrors({});
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getAppointmentTypeLabel = (type: string): string => {
    const appointmentType = appointmentTypes.find(apt => apt.value === type);
    return appointmentType ? appointmentType.label : type;
  };

  const formatDateTime = (date: string, time: string): string => {
    const appointmentDate = new Date(`${date}T${time}`);
    return appointmentDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const printAppointment = () => {
    if (!createdAppointment) return;
    
    // TODO: Implement print functionality
    const printContent = `
      ใบนัดหมาย
      หมายเลขนัด: ${createdAppointment.appointmentId}
      ผู้ป่วย: ${createdAppointment.patient.thaiName} (HN: ${createdAppointment.patient.hn})
      วันเวลานัด: ${formatDateTime(createdAppointment.appointmentDate, createdAppointment.appointmentTime)}
      ประเภทการนัด: ${getAppointmentTypeLabel(createdAppointment.appointmentType)}
      แพทย์: ${createdAppointment.doctor}
      หมายเหตุ: ${createdAppointment.notes || '-'}
    `;
    
    console.log("Printing appointment:", printContent);
    alert("กำลังพิมพ์ใบนัดหมาย...");
  };

  // Get minimum date (tomorrow)
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/emr"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                กลับ
              </Link>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">นัดหมาย</h1>
                <p className="text-gray-600">สร้างและจัดการใบนัดหมายผู้ป่วย</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {!createdAppointment ? (
          <>
            {/* Patient Search Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  ค้นหาผู้ป่วย
                </h2>
                <p className="text-slate-600">ค้นหาผู้ป่วยที่ต้องการสร้างใบนัดหมาย</p>
              </div>

              <div className="space-y-4">
                {/* Search Type Selection */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="queue"
                      checked={searchType === "queue"}
                      onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-slate-700">หมายเลขคิว</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hn"
                      checked={searchType === "hn"}
                      onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-slate-700">หมายเลข HN</span>
                  </label>
                </div>

                {/* Search Input */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={searchType === "queue" ? "Q001" : "HN2025001"}
                      disabled={isSearching}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      isSearching || !searchQuery.trim()
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isSearching ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        ค้นหา...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        ค้นหา
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-emerald-800 font-medium">ข้อมูลผู้ป่วย</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">คิว:</span>
                      <span className="ml-2 font-bold text-emerald-600 text-lg">{selectedPatient.queueNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">HN:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPatient.hn}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">ชื่อ:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPatient.thaiName}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">อายุ:</span>
                      <span className="ml-2 font-medium text-slate-800">{calculateAge(selectedPatient.birthDate)} ปี</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Form */}
            {selectedPatient && (
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    สร้างใบนัดหมาย
                  </h2>
                  <p className="text-slate-600">กรุณากรอกข้อมูลการนัดหมายให้ครบถ้วน</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
                  {/* Date & Time */}
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-emerald-600 font-semibold">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">วันเวลานัดหมาย</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          วันที่นัด <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={appointmentForm.appointmentDate}
                          onChange={(e) => handleInputChange("appointmentDate", e.target.value)}
                          min={getMinDate()}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                            errors.appointmentDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {errors.appointmentDate && <p className="text-red-500 text-sm mt-1">{errors.appointmentDate}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          เวลานัด <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={appointmentForm.appointmentTime}
                          onChange={(e) => handleInputChange("appointmentTime", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                            errors.appointmentTime ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {errors.appointmentTime && <p className="text-red-500 text-sm mt-1">{errors.appointmentTime}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div className="border-t pt-8">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">ประเภทการนัดหมาย</h3>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        เลือกประเภทการนัด <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {appointmentTypes.map((type) => (
                          <label
                            key={type.value}
                            className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              appointmentForm.appointmentType === type.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              value={type.value}
                              checked={appointmentForm.appointmentType === type.value}
                              onChange={(e) => handleInputChange("appointmentType", e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-800">{type.label}</span>
                              {appointmentForm.appointmentType === type.value && (
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{type.description}</p>
                          </label>
                        ))}
                      </div>
                      {errors.appointmentType && <p className="text-red-500 text-sm mt-2">{errors.appointmentType}</p>}
                    </div>
                  </div>

                  {/* Doctor & Department */}
                  <div className="border-t pt-8">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-semibold">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">แพทย์และแผนก</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          แผนก
                        </label>
                        <select
                          value={appointmentForm.department}
                          onChange={(e) => handleInputChange("department", e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="OPD">OPD - ผู้ป่วยนอก</option>
                          <option value="Emergency">Emergency - ฉุกเฉิน</option>
                          <option value="Surgery">Surgery - ศัลยกรรม</option>
                          <option value="Pediatrics">Pediatrics - กุมารเวชกรรม</option>
                          <option value="Obstetrics">Obstetrics - สูติ-นรีเวช</option>
                          <option value="Cardiology">Cardiology - หัวใจ</option>
                          <option value="Orthopedics">Orthopedics - กระดูก</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          แพทย์ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={appointmentForm.doctor}
                          onChange={(e) => handleInputChange("doctor", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                            errors.doctor ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          <option value="">เลือกแพทย์</option>
                          {doctors.map((doctor) => (
                            <option key={doctor} value={doctor}>{doctor}</option>
                          ))}
                        </select>
                        {errors.doctor && <p className="text-red-500 text-sm mt-1">{errors.doctor}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="border-t pt-8">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-orange-600 font-semibold">4</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">หมายเหตุ</h3>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        หมายเหตุการนัดหมาย
                      </label>
                      <textarea
                        value={appointmentForm.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="ระบุข้อมูลเพิ่มเติม เช่น เตรียมตัวก่อนมา, เอกสารที่ต้องนำมา, คำแนะนำพิเศษ"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="border-t pt-8">
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setSearchQuery("");
                        }}
                        className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-8 py-3 rounded-lg font-medium transition-all ${
                          isSubmitting
                            ? 'bg-emerald-400 text-white cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            กำลังสร้างใบนัด...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M5 7h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7z" />
                            </svg>
                            สร้างใบนัดหมาย
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          /* Appointment Success */
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">สร้างใบนัดหมายสำเร็จ!</h2>
              <p className="text-slate-600">ใบนัดหมายได้ถูกบันทึกในระบบแล้ว</p>
            </div>

            {/* Appointment Details */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-emerald-800 mb-4">รายละเอียดการนัดหมาย</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600">หมายเลขนัด:</span>
                    <span className="ml-2 font-bold text-emerald-600 text-lg">{createdAppointment.appointmentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ผู้ป่วย:</span>
                    <span className="ml-2 font-medium text-slate-800">{createdAppointment.patient.thaiName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">HN:</span>
                    <span className="ml-2 font-medium text-slate-800">{createdAppointment.patient.hn}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">วันเวลานัด:</span>
                    <span className="ml-2 font-medium text-slate-800">
                      {formatDateTime(createdAppointment.appointmentDate, createdAppointment.appointmentTime)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600">ประเภทการนัด:</span>
                    <span className="ml-2 font-medium text-slate-800">
                      {getAppointmentTypeLabel(createdAppointment.appointmentType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">แผนก:</span>
                    <span className="ml-2 font-medium text-slate-800">{createdAppointment.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">แพทย์:</span>
                    <span className="ml-2 font-medium text-slate-800">{createdAppointment.doctor}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">สถานะ:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      นัดแล้ว
                    </span>
                  </div>
                </div>
              </div>

              {createdAppointment.notes && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <span className="text-slate-600">หมายเหตุ:</span>
                  <p className="mt-1 text-slate-800">{createdAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={printAppointment}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  พิมพ์ใบนัด
                </div>
              </button>
              <button
                onClick={handleNewAppointment}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  นัดใหม่
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-1">คำแนะนำการสร้างใบนัดหมาย:</p>
              <ul className="space-y-1 text-emerald-700">
                <li>• เลือกวันเวลาที่เหมาะสมสำหรับผู้ป่วย</li>
                <li>• ระบุประเภทการนัดให้ชัดเจน (ตรวจซ้ำ, ฟังผล, ปรับยา)</li>
                <li>• เลือกแพทย์ที่เหมาะสมกับการรักษา</li>
                <li>• ใส่หมายเหตุหากมีข้อมูลเพิ่มเติมสำคัญ</li>
                <li>• พิมพ์ใบนัดให้ผู้ป่วยเพื่อเป็นหลักฐาน</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
