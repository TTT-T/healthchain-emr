'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Heart, Activity, FileText, Calendar, Clock, 
  Search, Filter, RefreshCw, AlertCircle, CheckCircle,
  Phone, MapPin, CreditCard, Stethoscope, Pill, TestTube
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { PatientService } from '@/services/patientService';
import { VisitService } from '@/services/visitService';

interface Patient {
  id: string;
  hn: string;
  nationalId: string;
  thaiName: string;
  gender: string;
  birthDate: string;
  age: number;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string[];
  chronicDiseases: string[];
  insurance: string;
  registrationDate: string;
  lastVisit: string;
  status: 'active' | 'inactive' | 'deceased';
}

interface Visit {
  id: string;
  visitNumber: string;
  visitDate: string;
  department: string;
  doctor: string;
  diagnosis: string;
  treatment: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

interface VitalSigns {
  id: string;
  visitId: string;
  measurementDate: string;
  weight: number;
  height: number;
  bmi: number;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  bloodSugar: number;
}

interface LabResult {
  id: string;
  visitId: string;
  testName: string;
  result: string;
  normalRange: string;
  unit: string;
  status: 'pending' | 'completed' | 'abnormal';
  testDate: string;
  reportDate: string;
}

interface Prescription {
  id: string;
  visitId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedDate: string;
  status: 'active' | 'completed' | 'discontinued';
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  department: string;
  doctor: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
}

export default function PatientSummary() {
  const { user, isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'hn' | 'name' | 'queue'>('hn');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'vitals' | 'labs' | 'prescriptions' | 'appointments'>('overview');

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated]);

  const loadPatients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading patients...');
      const response = await PatientService.searchPatients('', 'name');
      
      if (response.data && Array.isArray(response.data)) {
        // Convert MedicalPatient to Patient format
        const convertedPatients = response.data.map(convertMedicalPatientToPatient);
        setPatients(convertedPatients);
        console.log('✅ Patients loaded:', convertedPatients.length);
      } else {
        setPatients([]);
        console.log('⚠️ No patients found');
      }
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ป่วย');
    } finally {
      setIsLoading(false);
    }
  };

  const convertMedicalPatientToPatient = (medicalPatient: any): Patient => {
    return {
      id: medicalPatient.id,
      hn: medicalPatient.hn,
      nationalId: medicalPatient.national_id || '',
      thaiName: medicalPatient.thai_name || 'ไม่ระบุชื่อ',
      gender: medicalPatient.gender || 'ไม่ระบุ',
      birthDate: medicalPatient.birth_date || '',
      age: medicalPatient.age || 0,
      phone: medicalPatient.phone || '',
      address: medicalPatient.address || '',
      emergencyContact: medicalPatient.emergency_contact || '',
      emergencyPhone: medicalPatient.emergency_phone || '',
      bloodType: medicalPatient.blood_type || '',
      allergies: medicalPatient.allergies || [],
      chronicDiseases: medicalPatient.chronic_diseases || [],
      insurance: medicalPatient.insurance || '',
      registrationDate: medicalPatient.registration_date || '',
      lastVisit: medicalPatient.last_visit || '',
      status: medicalPatient.status || 'active'
    };
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('กรุณากรอกข้อมูลที่ต้องการค้นหา');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Searching patients by ${searchType}:`, searchQuery);
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.data && Array.isArray(response.data)) {
        const convertedPatients = response.data.map(convertMedicalPatientToPatient);
        setPatients(convertedPatients);
        
        if (convertedPatients.length === 0) {
          setError('ไม่พบข้อมูลผู้ป่วยที่ค้นหา');
        } else {
          console.log('✅ Search results:', convertedPatients.length);
        }
      } else {
        setPatients([]);
        setError('ไม่พบข้อมูลผู้ป่วยที่ค้นหา');
      }
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      setError('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientDetails = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);
    setError(null);
    
    try {
      console.log('📋 Loading patient details for:', patient.hn);
      
      // Load patient visits
      const visitsResponse = await apiClient.getPatientVisits(patient.id);
      if (visitsResponse.data) {
        // Convert MedicalVisit to Visit format
        const convertedVisits = visitsResponse.data.map((visit: any) => ({
          id: visit.id,
          visitNumber: visit.visit_number || 'N/A',
          visitDate: visit.visit_date || visit.created_at,
          department: visit.department || 'ไม่ระบุ',
          doctor: visit.doctor || 'ไม่ระบุ',
          diagnosis: visit.diagnosis || 'ไม่ระบุ',
          treatment: visit.treatment || 'ไม่ระบุ',
          status: visit.status || 'completed',
          notes: visit.notes || ''
        }));
        setVisits(convertedVisits);
      }
      
      // Load additional details based on visits
      if (visitsResponse.data && visitsResponse.data.length > 0) {
        const visitIds = visitsResponse.data.map((visit: any) => visit.id);
        
        // Load vital signs for all visits
        const vitalSignsPromises = visitIds.map((visitId: string) => 
          apiClient.getVitalSignsByVisit(visitId).catch(() => ({ data: [] }))
        );
        
        const vitalSignsResults = await Promise.all(vitalSignsPromises);
        const allVitalSigns = vitalSignsResults.flatMap(result => result.data || []);
        
        // Convert MedicalVitalSigns to VitalSigns format
        const convertedVitalSigns = allVitalSigns.map((vital: any) => ({
          id: vital.id,
          visitId: vital.visit_id || '',
          measurementDate: vital.measurement_date || vital.created_at,
          weight: vital.weight || 0,
          height: vital.height || 0,
          bmi: vital.bmi || 0,
          bloodPressure: `${vital.systolic_bp || 0}/${vital.diastolic_bp || 0}`,
          heartRate: vital.heart_rate || 0,
          temperature: vital.temperature || 0,
          respiratoryRate: vital.respiratory_rate || 0,
          oxygenSaturation: vital.oxygen_saturation || 0,
          bloodSugar: vital.blood_sugar || 0
        }));
        setVitalSigns(convertedVitalSigns);
        
        // Load lab results for all visits
        const labResultsPromises = visitIds.map((visitId: string) => 
          apiClient.getLabOrdersByVisit(visitId).catch(() => ({ data: [] }))
        );
        
        const labResultsResults = await Promise.all(labResultsPromises);
        const allLabResults = labResultsResults.flatMap((result: any) => result.data || []);
        
        // Convert lab orders to lab results format
        const convertedLabResults = allLabResults.map((lab: any) => ({
          id: lab.id,
          visitId: lab.visit_id || '',
          testName: lab.test_name || 'ไม่ระบุ',
          result: lab.result || 'รอผล',
          normalRange: lab.normal_range || 'ไม่ระบุ',
          unit: lab.unit || '',
          status: lab.status || 'pending',
          testDate: lab.test_date || lab.created_at,
          reportDate: lab.report_date || lab.updated_at
        }));
        setLabResults(convertedLabResults);
        
        // Load prescriptions for all visits
        const prescriptionsPromises = visitIds.map((visitId: string) => 
          apiClient.getPrescriptionsByVisit(visitId).catch(() => ({ data: [] }))
        );
        
        const prescriptionsResults = await Promise.all(prescriptionsPromises);
        const allPrescriptions = prescriptionsResults.flatMap((result: any) => result.data || []);
        
        // Convert MedicalPrescription to Prescription format
        const convertedPrescriptions = allPrescriptions.map((prescription: any) => ({
          id: prescription.id,
          visitId: prescription.visit_id || '',
          medicationName: prescription.medication_name || 'ไม่ระบุ',
          dosage: prescription.dosage || 'ไม่ระบุ',
          frequency: prescription.frequency || 'ไม่ระบุ',
          duration: prescription.duration || 'ไม่ระบุ',
          instructions: prescription.instructions || '',
          prescribedDate: prescription.prescribed_date || prescription.created_at,
          status: prescription.status || 'active'
        }));
        setPrescriptions(convertedPrescriptions);
      }
      
      // Load appointments (skip for now as API doesn't exist)
      // const appointmentsResponse = await apiClient.getPatientAppointments(patient.id);
      // if (appointmentsResponse.data) {
      //   setAppointments(appointmentsResponse.data);
      // }
      
      // Set empty appointments for now
      setAppointments([]);
      
      console.log('✅ Patient details loaded successfully');
    } catch (error) {
      console.error('❌ Error loading patient details:', error);
      setError('เกิดข้อผิดพลาดในการโหลดรายละเอียดผู้ป่วย');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h2>
          <p className="text-gray-600 mb-4">
            คุณต้องเข้าสู่ระบบก่อนเพื่อดูข้อมูลผู้ป่วย
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📋 สรุปข้อมูลผู้ป่วย
              </h1>
              <p className="mt-2 text-gray-600">
                ดูข้อมูลผู้ป่วยและประวัติการรักษาแบบครบถ้วน
              </p>
            </div>
            <button
              onClick={loadPatients}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ป่วย..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'hn' | 'name' | 'queue')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hn">HN</option>
                <option value="name">ชื่อ</option>
                <option value="queue">คิว</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Search className="mr-2 h-4 w-4" />
                ค้นหา
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  รายชื่อผู้ป่วย ({patients.length})
                </h2>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">กำลังโหลด...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>ไม่มีข้อมูลผู้ป่วย</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => loadPatientDetails(patient)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedPatient?.id === patient.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {patient.thaiName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              HN: {patient.hn}
                            </p>
                            <p className="text-sm text-gray-600">
                              {patient.gender} • {calculateAge(patient.birthDate)} ปี
                            </p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            patient.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedPatient.thaiName}
                      </h2>
                      <p className="text-gray-600">
                        HN: {selectedPatient.hn} • {selectedPatient.gender} • {calculateAge(selectedPatient.birthDate)} ปี
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPatient.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPatient.status === 'active' ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">เลขบัตรประชาชน</p>
                          <p className="font-medium">{selectedPatient.nationalId || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">เบอร์โทร</p>
                          <p className="font-medium">{selectedPatient.phone || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">ที่อยู่</p>
                          <p className="font-medium">{selectedPatient.address || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Heart className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">กรุ๊ปเลือด</p>
                          <p className="font-medium">{selectedPatient.bloodType || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">วันเกิด</p>
                          <p className="font-medium">{formatDate(selectedPatient.birthDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">มาพบครั้งล่าสุด</p>
                          <p className="font-medium">{formatDate(selectedPatient.lastVisit)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'overview', label: 'ภาพรวม', icon: User },
                        { id: 'visits', label: 'การมาพบ', icon: Stethoscope },
                        { id: 'vitals', label: 'สัญญาณชีพ', icon: Activity },
                        { id: 'labs', label: 'ผลแลบ', icon: TestTube },
                        { id: 'prescriptions', label: 'ใบสั่งยา', icon: Pill },
                        { id: 'appointments', label: 'นัดหมาย', icon: Calendar }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <tab.icon className="mr-2 h-4 w-4" />
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {isLoadingDetails ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                      </div>
                    ) : (
                      <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-blue-600 text-2xl font-bold">
                                  {visits.length}
                                </div>
                                <div className="text-sm text-blue-600">ครั้งที่มาพบ</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-green-600 text-2xl font-bold">
                                  {vitalSigns.length}
                                </div>
                                <div className="text-sm text-green-600">บันทึกสัญญาณชีพ</div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-purple-600 text-2xl font-bold">
                                  {prescriptions.length}
                                </div>
                                <div className="text-sm text-purple-600">ใบสั่งยา</div>
                              </div>
                            </div>
                            
                            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="font-semibold text-red-800 mb-2">แพ้ยา/อาหาร</h3>
                                <ul className="list-disc list-inside text-red-700">
                                  {selectedPatient.allergies.map((allergy, index) => (
                                    <li key={index}>{allergy}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {selectedPatient.chronicDiseases && selectedPatient.chronicDiseases.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-800 mb-2">โรคประจำตัว</h3>
                                <ul className="list-disc list-inside text-yellow-700">
                                  {selectedPatient.chronicDiseases.map((disease, index) => (
                                    <li key={index}>{disease}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visits Tab */}
                        {activeTab === 'visits' && (
                          <div className="space-y-4">
                            {visits.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Stethoscope className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p>ไม่มีประวัติการมาพบแพทย์</p>
                              </div>
                            ) : (
                              visits.map((visit) => (
                                <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      Visit #{visit.visitNumber}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      visit.status === 'completed' 
                                        ? 'bg-green-100 text-green-800'
                                        : visit.status === 'in_progress'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {visit.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">วันที่: {formatDateTime(visit.visitDate)}</p>
                                      <p className="text-gray-600">แผนก: {visit.department}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">แพทย์: {visit.doctor}</p>
                                      <p className="text-gray-600">การวินิจฉัย: {visit.diagnosis}</p>
                                    </div>
                                  </div>
                                  {visit.notes && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded">
                                      <p className="text-sm text-gray-700">{visit.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Vital Signs Tab */}
                        {activeTab === 'vitals' && (
                          <div className="space-y-4">
                            {vitalSigns.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p>ไม่มีข้อมูลสัญญาณชีพ</p>
                              </div>
                            ) : (
                              vitalSigns.map((vital) => (
                                <div key={vital.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">
                                      สัญญาณชีพ
                                    </h3>
                                    <span className="text-sm text-gray-600">
                                      {formatDateTime(vital.measurementDate)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">น้ำหนัก</p>
                                      <p className="font-medium">{vital.weight} kg</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ส่วนสูง</p>
                                      <p className="font-medium">{vital.height} cm</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">BMI</p>
                                      <p className="font-medium">{vital.bmi}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ความดันโลหิต</p>
                                      <p className="font-medium">{vital.bloodPressure}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ชีพจร</p>
                                      <p className="font-medium">{vital.heartRate} bpm</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">อุณหภูมิ</p>
                                      <p className="font-medium">{vital.temperature} °C</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">การหายใจ</p>
                                      <p className="font-medium">{vital.respiratoryRate} /min</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ออกซิเจน</p>
                                      <p className="font-medium">{vital.oxygenSaturation}%</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Lab Results Tab */}
                        {activeTab === 'labs' && (
                          <div className="space-y-4">
                            {labResults.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <TestTube className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p>ไม่มีผลการตรวจแลบ</p>
                              </div>
                            ) : (
                              labResults.map((lab) => (
                                <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {lab.testName}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      lab.status === 'abnormal' 
                                        ? 'bg-red-100 text-red-800'
                                        : lab.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {lab.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">ผลตรวจ</p>
                                      <p className="font-medium">{lab.result} {lab.unit}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ค่าปกติ</p>
                                      <p className="font-medium">{lab.normalRange}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">วันที่รายงาน</p>
                                      <p className="font-medium">{formatDate(lab.reportDate)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Prescriptions Tab */}
                        {activeTab === 'prescriptions' && (
                          <div className="space-y-4">
                            {prescriptions.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Pill className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p>ไม่มีใบสั่งยา</p>
                              </div>
                            ) : (
                              prescriptions.map((prescription) => (
                                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {prescription.medicationName}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      prescription.status === 'active' 
                                        ? 'bg-green-100 text-green-800'
                                        : prescription.status === 'completed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {prescription.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">ขนาด: {prescription.dosage}</p>
                                      <p className="text-gray-600">ความถี่: {prescription.frequency}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">ระยะเวลา: {prescription.duration}</p>
                                      <p className="text-gray-600">วันที่สั่ง: {formatDate(prescription.prescribedDate)}</p>
                                    </div>
                                  </div>
                                  {prescription.instructions && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded">
                                      <p className="text-sm text-gray-700">{prescription.instructions}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Appointments Tab */}
                        {activeTab === 'appointments' && (
                          <div className="space-y-4">
                            {appointments.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p>ไม่มีนัดหมาย</p>
                              </div>
                            ) : (
                              appointments.map((appointment) => (
                                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {appointment.type}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      appointment.status === 'confirmed' 
                                        ? 'bg-green-100 text-green-800'
                                        : appointment.status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-800'
                                        : appointment.status === 'completed'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">วันที่: {formatDate(appointment.appointmentDate)}</p>
                                      <p className="text-gray-600">เวลา: {appointment.appointmentTime}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">แผนก: {appointment.department}</p>
                                      <p className="text-gray-600">แพทย์: {appointment.doctor}</p>
                                    </div>
                                  </div>
                                  {appointment.notes && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded">
                                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center text-gray-500">
                  <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>เลือกผู้ป่วยจากรายชื่อทางซ้ายเพื่อดูรายละเอียด</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
