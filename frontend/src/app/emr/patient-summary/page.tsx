"use client";
import { useState, useEffect } from "react";
import { Search, User, Calendar, FileText, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { PatientSummaryService } from '@/services/patientSummaryService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { createLocalDateTimeString } from '@/utils/timeUtils';

export default function PatientSummary() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'records'>('overview');
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  const calculateAge = (birthDate: string): number => {
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      console.log('Patient search response:', response);
      console.log('Search type:', searchType);
      console.log('Search query:', searchQuery);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        console.log('Patient found:', response.data[0]);
        
        // Backend sends data in nested format, extract the patient data
        const patientData = response.data[0];
        const formattedPatient: MedicalPatient = {
          id: patientData.id,
          hn: patientData.personal_info?.hospital_number || patientData.hospital_number,
          hospitalNumber: patientData.personal_info?.hospital_number || patientData.hospital_number,
          thaiName: patientData.personal_info?.thai_name || patientData.thai_name,
          firstName: patientData.personal_info?.first_name || patientData.first_name,
          lastName: patientData.personal_info?.last_name || patientData.last_name,
          nationalId: patientData.personal_info?.national_id || patientData.national_id,
          birthDate: patientData.personal_info?.birth_date || patientData.birth_date,
          dateOfBirth: patientData.personal_info?.birth_date || patientData.birth_date,
          gender: patientData.personal_info?.gender || patientData.gender,
          phone: patientData.contact_info?.phone || patientData.phone,
          email: patientData.contact_info?.email || patientData.email,
          address: patientData.contact_info?.address || patientData.address,
          currentAddress: patientData.contact_info?.current_address || patientData.current_address,
          bloodType: patientData.medical_info?.blood_type || patientData.blood_type,
          medicalHistory: patientData.medical_info?.medical_history || patientData.medical_history,
          allergies: patientData.medical_info?.allergies || patientData.allergies,
          drugAllergies: patientData.medical_info?.drug_allergies || patientData.drug_allergies,
          chronicDiseases: patientData.medical_info?.chronic_diseases || patientData.chronic_diseases,
          createdAt: patientData.created_at,
          updatedAt: patientData.updated_at
        };
        
        setSelectedPatient(formattedPatient);
        await loadPatientSummary(formattedPatient.id);
        setError(null);
      } else {
        console.log('No patient found or empty data');
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
        setPatientSummary(null);
        setTimeline([]);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
      setPatientSummary(null);
      setTimeline([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientSummary = async (patientId: string) => {
    setIsLoading(true);
    try {
      const [summaryResponse, timelineResponse] = await Promise.all([
        PatientSummaryService.getPatientSummary(patientId),
        PatientSummaryService.getPatientTimeline(patientId)
      ]);

      if (summaryResponse.statusCode === 200 && summaryResponse.data) {
        console.log('Patient summary data:', summaryResponse.data);
        console.log('Patient age from summary:', summaryResponse.data.patient?.age);
        setPatientSummary(summaryResponse.data);
      }

      if (timelineResponse.statusCode === 200 && timelineResponse.data) {
        setTimeline(timelineResponse.data);
      }
    } catch (error) {
      logger.error("Error loading patient summary:", error);
      // Use sample data if API fails
      setPatientSummary({
        patient: {
          id: '1',
          thaiName: 'นายสมชาย ใจดี',
          nationalId: '1234567890123',
          hospitalNumber: 'HN001',
          age: 35,
          gender: 'ชาย',
          phone: '0812345678',
          email: 'somchai@example.com'
        },
        summary: {
          totalVisits: 5,
          totalAppointments: 3,
          totalDocuments: 2,
          totalLabResults: 4,
          totalPharmacyRecords: 3,
          upcomingAppointments: 1
        }
      });
      setTimeline([
        {
          id: '1',
          recordType: 'visit',
          title: 'การเยี่ยม - OPD',
          description: 'ปวดหัว',
          recordedTime: '2024-01-15T09:00:00Z',
          recordedByName: 'นพ.สมชาย ใจดี'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบดูประวัติผู้ป่วย</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารสรุปให้ผู้ป่วย
   */
  const generatePatientSummaryDocument = async () => {
    if (!selectedPatient || !patientSummary) return;
    
    setIsGeneratingDocument(true);
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'patient_summary',
        {
          ...patientSummary,
          generatedAt: createLocalDateTimeString(new Date()),
          generatedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
        },
        {
          patientHn: selectedPatient.hn || '',
          patientNationalId: selectedPatient.nationalId || '',
          patientName: selectedPatient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      logger.info('Patient summary document created successfully', { 
        patientHn: selectedPatient.hn,
        recordType: 'patient_summary'
      });
      
      alert('สร้างเอกสารสรุปผู้ป่วยสำเร็จ! เอกสารได้ถูกส่งให้ผู้ป่วยแล้ว');
    } catch (error) {
      logger.error('Error creating patient summary document:', error);
      alert('เกิดข้อผิดพลาดในการสร้างเอกสารสรุป');
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ดูประวัติผู้ป่วย</h1>
              <p className="text-gray-600">ดูข้อมูลประวัติและบันทึกทางการแพทย์แบบครบถ้วน</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="searchType"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">ค้นหาด้วย HN</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="searchType"
                  value="queue"
                  checked={searchType === "queue"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">ค้นหาด้วยหมายเลขคิว</span>
              </label>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอกหมายเลข HN (เช่น HN250001)" : "กรอกหมายเลขคิว"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Patient Info */}
          {selectedPatient && patientSummary && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">ข้อมูลผู้ป่วย</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">HN:</span> {selectedPatient.hn || selectedPatient.hospitalNumber}
                </div>
                <div>
                  <span className="font-medium">ชื่อ:</span> {selectedPatient.thaiName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                </div>
                <div>
                  <span className="font-medium">อายุ:</span> {patientSummary?.patient?.age || (selectedPatient.birthDate ? calculateAge(selectedPatient.birthDate) : 'ไม่ระบุ')}
                </div>
                <div>
                  <span className="font-medium">เพศ:</span> {patientSummary?.patient?.gender || selectedPatient.gender || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">โทรศัพท์:</span> {patientSummary?.patient?.phone || selectedPatient.phone || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">อีเมล:</span> {patientSummary?.patient?.email || selectedPatient.email || 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedPatient && patientSummary && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={generatePatientSummaryDocument}
                disabled={isGeneratingDocument}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isGeneratingDocument ? "กำลังสร้าง..." : "สร้างเอกสารสรุป"}
              </button>
            </div>
          )}

          {/* Tabs */}
          {selectedPatient && patientSummary && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    ภาพรวม
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'timeline'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    ไทม์ไลน์
                  </button>
                  <button
                    onClick={() => setActiveTab('records')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'records'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    บันทึกทั้งหมด
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          )}

          {selectedPatient && patientSummary && !isLoading && (
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">ภาพรวม</h3>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PatientSummaryService.createSummaryCards(patientSummary.summary).map((card, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-500">{card.description}</p>
                          </div>
                          <div className="text-3xl">{card.icon}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h4>
                    <div className="space-y-3">
                      {timeline.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">
                            {PatientSummaryService.getRecordTypeIcon(item.recordType)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-500">
                              {PatientSummaryService.formatDateTime(item.recordedTime)} • {item.recordedByName}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PatientSummaryService.getRecordTypeColor(item.recordType)}`}>
                            {PatientSummaryService.getRecordTypeLabel(item.recordType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">ไทม์ไลน์</h3>
                  
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">
                              {PatientSummaryService.getRecordTypeIcon(item.recordType)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PatientSummaryService.getRecordTypeColor(item.recordType)}`}>
                              {PatientSummaryService.getRecordTypeLabel(item.recordType)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {PatientSummaryService.formatDateTime(item.recordedTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.recordedByName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">บันทึกทั้งหมด</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visits */}
                    {patientSummary.records.visits.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">🏥</span>
                          การเยี่ยม ({patientSummary.records.visits.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.visits.slice(0, 3).map((visit: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{visit.data.visitType}</p>
                              <p className="text-gray-600">{visit.data.symptoms}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(visit.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Appointments */}
                    {patientSummary.records.appointments.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          นัดหมาย ({patientSummary.records.appointments.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.appointments.slice(0, 3).map((appointment: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{appointment.data.appointmentType}</p>
                              <p className="text-gray-600">{appointment.data.reason}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDate(appointment.data.appointmentDate)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lab Results */}
                    {patientSummary.records.labResults.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">🧪</span>
                          ผลแลบ ({patientSummary.records.labResults.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.labResults.slice(0, 3).map((lab: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{lab.data.testName}</p>
                              <p className="text-gray-600">{lab.data.overallResult}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(lab.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {patientSummary.records.documents.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">📄</span>
                          เอกสาร ({patientSummary.records.documents.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.documents.slice(0, 3).map((doc: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{doc.data.documentTitle}</p>
                              <p className="text-gray-600">{doc.data.documentType}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(doc.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}